const admin = require('firebase-admin');
const moment = require('moment-timezone');

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

const sessionsCollectionName = process.env.SESSIONS_COLLECTION_NAME;

exports.createSession = async (req, res) => {
    let baseEventIds = req.body.baseEventIds;
    let addedSession = await db.collection(sessionsCollectionName).add({ baseEventIds });
    res.status(200).send(addedSession.id);
};