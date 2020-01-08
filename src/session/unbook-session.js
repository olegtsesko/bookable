const admin = require('firebase-admin');
const moment = require('moment-timezone');
const request = require('request-promise-native');

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

const sessionsCollectionName = process.env.SESSIONS_COLLECTION_NAME;
const bookEventSlotsUrl = process.env.BOOK_EVENT_SLOTS_URL;
const unbookEventSlotsUrl = process.env.UNBOOK_EVENT_SLOTS_URL;

exports.unbookSession = async (req, res) => {
    let sessionId = req.body.sessionId;
    let dates = req.body.dates;
    let countForUnbooking = req.body.countForUnbooking;

    let sessionRef = db.collection(sessionsCollectionName).doc(sessionId);
    let session = (await sessionRef.get()).data();

    let unbookedEvents = [];

    try {
        session.baseEventIds.forEach((baseEventId, index) => {
            await request.post(unbookEventSlotsUrl, {
                countForUnbooking,
                date: dates[index],
                baseEventId
            });
            unbookedEvents.push({ id, date: dates[index] });
        });
        res.status(200).send(`Successfully unbooked ${countForBooking} places`);
    }
    catch {
        unbookedEvents.forEach((baseEvent, index) => {
            await request.post(bookEventSlotsUrl, {
                countForBooking: countForUnbooking,
                date: baseEvent.date,
                baseEventId: baseEvent.id
            });
        });
        res.status(400).send('An error while unbooking');
    }
};