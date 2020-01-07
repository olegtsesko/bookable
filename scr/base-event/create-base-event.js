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

    let startMoment = moment.tz(startDate, timezone);
    let endMoment = moment.tz(endDate, timezone)
        .add(1, 'day'); // include endDate in diapason

    let instances = [];

    weekDays.forEach((weekDay, index) => {
        if (weekDay) {
            let weekDayNumber = index + 1;
            let hhMm = weekDay.split(':');
            let hours = hhMm[0];
            let minutes = hhMm[1];

            let tmpMoment = startMoment.clone()
                .hours(hours)
                .minutes(minutes)
                .day(weekDayNumber);

            if (tmpMoment.isAfter(startMoment, 'd')) {
                instances.push(tmpMoment.unix());
            }
            while (tmpMoment.isBefore(endMoment)) {
                tmpMoment.add(7, 'days');
                instances.push(tmpMoment.unix());
            }
        }
    })

    let addedBaseEvent = await db.collection(baseEventsCollectionName).add({
        weekDays,
        startDate,
        endDate,
        slotsCount,
        instances
    });
    res.status(200).send(addedBaseEvent.id);
};