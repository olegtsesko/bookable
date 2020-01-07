const admin = require('firebase-admin');
const moment = require('moment-timezone');

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

exports.getAvailableEventSlots = async (req, res) => {
    let date = req.query.date;
    let baseEventId = req.query.baseEventId;

    let result = null;

    let baseEvent = db.collection('base-events').doc(baseEventId);
    let timezone = baseEvent.timezone;

    let dateMoment = moment.tz(date, timezone);

    let existsEventMoment = baseEvent.instances.find(instance => moment.tz(instance, timezone).isSame(dateMoment));

    if (existsEventMoment) {
        let occupiedSlots = 0;
        let eventBookings = await baseEvent.collection('event-bookings')
            .where('eventDatetime', '==', existsEventMoment)
            .get();
        eventBookings.forEach(eventBooking => {
            occupiedSlots += eventBooking.occupation;
        });
        result = baseEvent.slotsCount - occupiedSlots;
    }
    res.status(200).send(result);
};