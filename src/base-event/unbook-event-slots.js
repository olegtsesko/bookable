const admin = require('firebase-admin');
const moment = require('moment-timezone');

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

const baseEventsCollectionName = process.env.BASE_EVENTS_COLLECTION_NAME;

exports.unbookEventSlots = async (req, res) => {
    let baseEventId = req.body.baseEventId;
    let countForUnbooking = req.body.countForUnbooking;
    let date = req.body.date;

    let baseEventRef = db.collection(baseEventsCollectionName).doc(baseEventId);

    let slotsQuery = baseEventRef.collection(date);

    db.runTransaction(t => {
        return t.get(slotsQuery)
            .then(eventBookingsSnapshot => {

                let occupiedSlots = 0;

                eventBookingsSnapshot.forEach(eventBooking => {
                    occupiedSlots += eventBooking.data().occupation;
                });

                if (countForUnbooking > occupiedSlots) {
                    throw "Slots count for unbooking is greater than occupied slots";
                }

                for (let i = 0; i < countForUnbooking; i++) {
                    let newBookingRef = baseEventRef.collection(date).doc();
                    t.set(newBookingRef, {
                        eventDatetime,
                        occupation: -1,
                        datetime: moment().unix()
                    });
                }
            });
    }).then(result => {
        res.status(200).send(`${countForUnbooking} places successfully unbooked`);
    }).catch(err => {
        res.status(400).send(err);
    });
};