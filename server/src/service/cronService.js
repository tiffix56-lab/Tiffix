import cron from 'node-cron'
import UserSubscription from '../models/userSubscription.model.js'
import TimezoneUtil from '../util/timezone.js'

class CronService {
    constructor() {
        this.jobs = new Map()
    }

    init() {
        console.log('🕐 Initializing Cron Jobs...')

        // Check expired subscriptions at 12:01 AM IST daily
        this.scheduleJob('expiredSubscriptions', '1 0 * * *', this.checkExpiredSubscriptions.bind(this))

        console.log('✅ Cron Jobs initialized successfully')
    }

    scheduleJob(name, schedule, task) {
        try {
            const job = cron.schedule(schedule, async () => {
                console.log(`🔄 Running cron job: ${name} at ${TimezoneUtil.format(TimezoneUtil.now())}`)
                try {
                    await task()
                    console.log(`✅ Cron job completed: ${name}`)
                } catch (error) {
                    console.error(`❌ Error in cron job ${name}:`, error)
                }
            }, {
                scheduled: true,
                timezone: 'Asia/Kolkata'
            })

            this.jobs.set(name, job)
            console.log(`📅 Scheduled cron job: ${name} with pattern: ${schedule}`)
        } catch (error) {
            console.error(`❌ Failed to schedule cron job ${name}:`, error)
        }
    }

    async checkExpiredSubscriptions() {
        console.log('🔍 Checking expired subscriptions at 12:01 AM IST...')

        try {
            const now = TimezoneUtil.now()
            const today = TimezoneUtil.startOfDay(now)

            console.log(`📅 Current date: ${TimezoneUtil.format(today, 'date')}`)

            // Find subscriptions where endDate < today and not already marked expired
            const expiredSubscriptions = await UserSubscription.find({
                endDate: { $lt: today },
                isExpired: false
            })

            console.log(`📊 Found ${expiredSubscriptions.length} expired subscriptions`)

            let updatedCount = 0

            for (const subscription of expiredSubscriptions) {
                console.log(`🔍 Subscription ${subscription._id} - End date: ${TimezoneUtil.format(subscription.endDate, 'date')} - EXPIRED`)

                subscription.isExpired = true
                subscription.status = 'expired'
                await subscription.save()
                updatedCount++
            }

            console.log(`✅ Marked ${updatedCount} subscriptions as expired`)

        } catch (error) {
            console.error('❌ Error checking expired subscriptions:', error)
            throw error
        }
    }

    // Manual trigger for testing
    async triggerExpiredCheck() {
        console.log('🔧 Manually triggering expired subscription check...')
        await this.checkExpiredSubscriptions()
    }

    stopAllJobs() {
        console.log('⏹️ Stopping all cron jobs...')
        for (const [name, job] of this.jobs) {
            job.stop()
            console.log(`⏹️ Stopped job: ${name}`)
        }
    }
}

const cronService = new CronService()

export default cronService