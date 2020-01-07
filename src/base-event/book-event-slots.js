const admin = require('firebase-admin');
const moment = require('moment-timezone');

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

const baseEventsCollectionName = process.env.BASE_EVENTS_COLLECTION_NAME;
const eventBookingsCollectionName = process.env.EVENT_BOOKINGS_COLLECTION_NAME;

exports.bookEventSlots = async (req, res) => {
    let baseEventId = req.body.baseEventId;
    let countForBooking = req.body.countForBooking;
    let eventDatetime = req.body.eventDatetime;

    let baseEventRef = db.collection(baseEventsCollectionName).doc(baseEventId);
    let baseEvent = (await baseEventRef.get()).data();

    let slotsQuery = baseEventRef.collection(eventBookingsCollectionName)
        .where('eventDatetime', '==', eventDatetime);

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
                    let newBookingRef = baseEventRef.collection(eventBookingsCollectionName).doc();
                    t.set(newBookingRef, {
                        eventDatetime,
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
};