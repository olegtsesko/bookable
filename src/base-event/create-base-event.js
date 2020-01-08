const admin = require('firebase-admin');
const moment = require('moment-timezone');

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

const baseEventsCollectionName = process.env.BASE_EVENTS_COLLECTION_NAME;

exports.createBaseEvent = async (req, res) => {
    let weekDays = req.body.weekDays;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let slotsCount = req.body.slotsCount;
    let timezone = req.body.timezone;

    let startDate = moment.tz(startDate, timezone).unix();
    let endDate = moment.tz(endDate, timezone).add(1, 'day').unix();    

    let addedBaseEvent = await db.collection(baseEventsCollectionName).add({
        weekDays,
        startDate,
        endDate,
        slotsCount,
    });
    res.status(200).send(addedBaseEvent.id);
};