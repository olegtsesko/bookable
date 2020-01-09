const admin = require('firebase-admin');
const moment = require('moment-timezone');

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

const sessionsCollectionName = process.env.SESSIONS_COLLECTION_NAME;

exports.createSession = async (req, res) => {
    let baseEventIds = req.body.baseEventIds;
    let sessionIds = req.body.sessionIds;

    if (!sessionIds && !baseEventIds) {
        res.status(400).send('Error: post baseEventIds or sessionIds');
    }
    else if (sessionIds && baseEventIds) {
        res.status(400).send('Error: post only baseEventIds or only sessionIds');
    }
    else {
        let entityToAdding = { baseEventIds };
        if (sessionIds) entityToAdding = { sessionIds };

        let addedSessionRef = await db.collection(sessionsCollectionName).add(entityToAdding);
        res.status(200).send(addedSessionRef.id);
    }
};