const admin = require('firebase-admin');
const moment = require('moment-timezone');
const request = require('request-promise-native');

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

const sessionsCollectionName = process.env.SESSIONS_COLLECTION_NAME;
const getAvailableEventSlotsUrl = process.env.GET_AVAILABLE_EVENT_SLOTS_URL;
const getAvailableSessionSlotsUrl = process.env.GET_AVAILABLE_SESSION_SLOTS_URL;

exports.getAvailableSessionSlots = async (req, res) => {
    let sessionId = req.body.sessionId;
    let dates = req.body.dates;

    let sessionRef = db.collection(sessionsCollectionName).doc(sessionId);
    let session = (await sessionRef.get()).data();

    let minimalAvailableSlotsCount = null;

    let elems = session.baseEventIds;
    if (!elems) elems = session.sessionIds;

    let uri = session.baseEventIds ? getAvailableEventSlotsUrl : getAvailableSessionSlotsUrl;

    elems.forEach((id, index) => {
        let body = session.baseEventIds ? { baseEventId: id, date: dates[index] } : { sessionId: id, dates: dates[index] }
        try {
            let availableSlotsCount = await request.post(uri, body);
            if (minimalAvailableSlotsCount === null || minimalAvailableSlotsCount > availableSlotsCount) {
                minimalAvailableSlotsCount = availableSlotsCount;
            }
        }
        catch (err) {

        }
    });

    res.status(200).send(minimalAvailableSlotsCount);
};