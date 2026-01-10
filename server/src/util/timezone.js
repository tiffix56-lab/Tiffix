/**
 * Indian Timezone Utility Functions
 * Handles all date/time operations in Indian Standard Time (IST) using Day.js
 */

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'

// Load required plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const INDIAN_TIMEZONE = 'Asia/Kolkata'

class TimezoneUtil {
    /**
     * Get current IST date object
     * @returns {Date} Current date in IST (as JS Date object)
     */
    static now() {
        return dayjs().tz(INDIAN_TIMEZONE).toDate()
    }

    /**
     * Convert any date to IST
     * @param {Date|string} date - Date to convert
     * @returns {Date} Date in IST
     */
    static toIST(date) {
        return dayjs(date).tz(INDIAN_TIMEZONE).toDate()
    }

    /**
     * Get start of day in IST
     * @param {Date|string} date - Optional date, defaults to current
     * @returns {Date} Start of day in IST
     */
    static startOfDay(date = null) {
        return dayjs(date || undefined).tz(INDIAN_TIMEZONE).startOf('day').toDate()
    }

    /**
     * Get end of day in IST
     * @param {Date|string} date - Optional date, defaults to current
     * @returns {Date} End of day in IST
     */
    static endOfDay(date = null) {
        return dayjs(date || undefined).tz(INDIAN_TIMEZONE).endOf('day').toDate()
    }

    /**
     * Add days to IST date
     * @param {number} days - Number of days to add
     * @param {Date|string} date - Base date, defaults to current
     * @returns {Date} New date in IST
     */
    static addDays(days, date = null) {
        return dayjs(date || undefined).tz(INDIAN_TIMEZONE).add(days, 'day').toDate()
    }

    /**
     * Add months to IST date
     * @param {number} months - Number of months to add
     * @param {Date|string} date - Base date, defaults to current
     * @returns {Date} New date in IST
     */
    static addMonths(months, date = null) {
        return dayjs(date || undefined).tz(INDIAN_TIMEZONE).add(months, 'month').toDate()
    }

    /**
     * Format date for IST display
     * @param {Date|string} date - Date to format
     * @param {string} format - Format type ('date', 'datetime', 'time', 'time24')
     * @returns {string} Formatted date string
     */
    static format(date, format = 'datetime') {
        const d = dayjs(date).tz(INDIAN_TIMEZONE)
        
        switch (format) {
            case 'date':
                return d.format('DD/MM/YYYY')
            case 'time':
            case 'time24':
                return d.format('HH:mm:ss')
            case 'datetime':
            default:
                return d.format('DD/MM/YYYY, HH:mm:ss')
        }
    }

    /**
     * Get time in HH:MM format (24-hour)
     * @param {Date|string} date - Date to format
     * @returns {string} Time in HH:MM format
     */
    static getTimeString(date = null) {
        return dayjs(date || undefined).tz(INDIAN_TIMEZONE).format('HH:mm')
    }

    /**
     * Parse time string (HH:MM) and create date with current IST date
     * @param {string} timeString - Time in HH:MM format
     * @param {Date|string} baseDate - Base date, defaults to current
     * @returns {Date} Date with specified time in IST
     */
    static parseTimeString(timeString, baseDate = null) {
        const [hours, minutes] = timeString.split(':').map(Number)
        return dayjs(baseDate || undefined)
            .tz(INDIAN_TIMEZONE)
            .hour(hours)
            .minute(minutes)
            .second(0)
            .millisecond(0)
            .toDate()
    }

    /**
     * Check if time string is within a time range
     * @param {string} time - Time in HH:MM format
     * @param {string} startTime - Start time in HH:MM format
     * @param {string} endTime - End time in HH:MM format
     * @returns {boolean} True if time is within range
     */
    static isTimeInRange(time, startTime, endTime) {
        const timeMinutes = this.timeStringToMinutes(time)
        const startMinutes = this.timeStringToMinutes(startTime)
        const endMinutes = this.timeStringToMinutes(endTime)
        
        if (startMinutes <= endMinutes) {
            // Normal range (e.g., 09:00 - 17:00)
            return timeMinutes >= startMinutes && timeMinutes <= endMinutes
        } else {
            // Overnight range (e.g., 22:00 - 06:00)
            return timeMinutes >= startMinutes || timeMinutes <= endMinutes
        }
    }

    /**
     * Convert time string to minutes since midnight
     * @param {string} timeString - Time in HH:MM format
     * @returns {number} Minutes since midnight
     */
    static timeStringToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number)
        return hours * 60 + minutes
    }

    /**
     * Get IST date range for analytics
     * @param {string} period - 'today', 'week', 'month', 'year'
     * @returns {Object} {startDate, endDate}
     */
    static getDateRange(period) {
        const now = dayjs().tz(INDIAN_TIMEZONE)
        let startDate, endDate

        switch (period) {
            case 'today':
                startDate = now.startOf('day')
                endDate = now.endOf('day')
                break
            case 'week':
                // Last 7 days
                startDate = now.subtract(6, 'day').startOf('day')
                endDate = now.endOf('day')
                break
            case 'month':
                startDate = now.startOf('month')
                endDate = now.endOf('month')
                break
            case 'year':
                startDate = now.startOf('year')
                endDate = now.endOf('year')
                break
            default:
                startDate = now.startOf('day')
                endDate = now.endOf('day')
        }

        return { 
            startDate: startDate.toDate(), 
            endDate: endDate.toDate() 
        }
    }

    /**
     * Check if date is in IST business hours (9 AM - 6 PM)
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if in business hours
     */
    static isBusinessHours(date = null) {
        const hour = dayjs(date || undefined).tz(INDIAN_TIMEZONE).hour()
        return hour >= 9 && hour < 18
    }

    /**
     * Get next business day in IST
     * @param {Date|string} date - Base date
     * @returns {Date} Next business day
     */
    static nextBusinessDay(date = null) {
        let d = dayjs(date || undefined).tz(INDIAN_TIMEZONE).add(1, 'day')
        
        // 0 is Sunday, 6 is Saturday
        while (d.day() === 0 || d.day() === 6) {
            d = d.add(1, 'day')
        }
        
        return d.toDate()
    }

    /**
     * Calculate age in days from IST date
     * @param {Date|string} date - Start date
     * @returns {number} Age in days
     */
    static ageInDays(date) {
        const start = dayjs(date).tz(INDIAN_TIMEZONE)
        const now = dayjs().tz(INDIAN_TIMEZONE)
        return Math.ceil(now.diff(start, 'day', true))
    }

    /**
     * Get financial year dates (April 1 - March 31) in IST
     * @param {number} year - Optional year, defaults to current FY
     * @returns {Object} {startDate, endDate, year}
     */
    static getFinancialYear(year = null) {
        const now = dayjs().tz(INDIAN_TIMEZONE)
        const currentMonth = now.month() // 0-11
        
        // Determine financial year
        let fyYear
        if (year) {
            fyYear = year
        } else {
            // If current month is Jan(0), Feb(1), Mar(2), current FY started previous year
            fyYear = currentMonth >= 3 ? now.year() : now.year() - 1
        }
        
        // Create dates in IST directly to avoid UTC shifts
        const startDate = dayjs.tz(`${fyYear}-04-01`, INDIAN_TIMEZONE).startOf('day')
        const endDate = dayjs.tz(`${fyYear + 1}-03-31`, INDIAN_TIMEZONE).endOf('day')
        
        return {
            startDate: startDate.toDate(),
            endDate: endDate.toDate(),
            year: fyYear
        }
    }
}

export default TimezoneUtil