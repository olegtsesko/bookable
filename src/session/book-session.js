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

exports.bookSession = async (req, res) => {
    let sessionId = req.body.sessionId;
    let dates = req.body.dates;
    let countForBooking = req.body.countForBooking;

    let sessionRef = db.collection(sessionsCollectionName).doc(sessionId);
    let session = (await sessionRef.get()).data();

    let bookedEvents = [];

    try {
        session.baseEventIds.forEach((baseEventId, index) => {
            await request.post(bookEventSlotsUrl, {
                countForBooking,
                date: dates[index],
                baseEventId
            });
            bookedEvents.push({ id, date: dates[index] });
        });
        res.status(200).send(`Successfully booked ${countForBooking} places`);
    }
    catch {
        bookedEvents.forEach((baseEvent, index) => {
            await request.post(unbookEventSlotsUrl, {
                countForUnbooking: countForBooking,
                date: baseEvent.date,
                baseEventId: baseEvent.id
            });
        });
        res.status(400).send('An error while booking');
    }    
};