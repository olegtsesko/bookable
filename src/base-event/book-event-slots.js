const admin = require('firebase-admin');
const moment = require('moment-timezone');

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

const baseEventsCollectionName = process.env.BASE_EVENTS_COLLECTION_NAME;

exports.bookEventSlots = async (req, res) => {
    let baseEventId = req.body.baseEventId;
    let countForBooking = req.body.countForBooking;
    let date = req.body.date;

    let baseEventRef = db.collection(baseEventsCollectionName).doc(baseEventId);
    let baseEvent = (await baseEventRef.get()).data();
    let timezone = baseEvent.timezone;

    let dateMoment = moment.tz(date, timezone);

    let isWeekDayInRule = baseEvent.weekDays.some((weekDay, index) => {
        if (weekDay) {
            let weekDayNumber = index + 1;
            return dateMoment.day() === weekDayNumber;
        }
        else return false;
    });

    let startDateMoment = moment(baseEvent.startDate);
    let endDateMoment = moment(baseEvent.endDate);

    let isDiapasonInRule = startDateMoment.isBefore(dateMoment) && dateMoment.isBefore(endDateMoment);

    if (isWeekDayInRule && isDiapasonInRule) {
        let slotsQuery = baseEventRef.collection(date);

        db.runTransaction(t => {
            return t.get(slotsQuery)
                .then(eventBookingsSnapshot => {

                    let occupiedSlots = 0;

                    eventBookingsSnapshot.forEach(eventBookingRef => {
                        occupiedSlots += eventBookingRef.data().occupation;
                    });

                    let availableSlots = baseEvent.slotsCount - occupiedSlots;

                    if (countForBooking > availableSlots) {
                        throw "There are not enough places in event";
                    }

                    for (let i = 0; i < countForBooking; i++) {
                        let newBookingRef = baseEventRef.collection(date).doc();
                        t.set(newBookingRef, {
                            occupation: 1,
                            datetime: moment().unix()
                        });
                    }
                });
        }).then(result => {
            res.status(200).send(`${countForBooking} places successfully booked`);
        }).catch(err => {
            res.status(400).send(err);
        });
    }
};