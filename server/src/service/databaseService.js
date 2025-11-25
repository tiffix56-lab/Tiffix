import mongoose from 'mongoose';
import config from '../config/config.js';

export default {
    connect: async () => {
        try {
            await mongoose.connect(config.database.url);

            await mongoose.connection.db.collection('subscriptions').dropIndex('planMenus_1');
            return mongoose.connection;
        } catch (err) {
            throw err;
        }
    },
};
