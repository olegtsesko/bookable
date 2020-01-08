const admin = require('firebase-admin');
const moment = require('moment-timezone');

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

const baseEventsCollectionName = process.env.BASE_EVENTS_COLLECTION_NAME;

exports.getAvailableEventSlots = async (req, res) => {
    let date = req.query.date;
    let baseEventId = req.query.baseEventId;

    let result = null;

    let baseEventRef = db.collection(baseEventsCollectionName).doc(baseEventId);
    let baseEvent = await (baseEventRef.get()).data();
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
        let occupiedSlots = 0;
        let eventBookingsSnapshot = await baseEventRef.collection(date).get();
        eventBookingsSnapshot.forEach(eventBooking => {
            occupiedSlots += eventBooking.data().occupation;
        });
        result = baseEvent.slotsCount - occupiedSlots;
    }
    res.status(200).send(result);
};