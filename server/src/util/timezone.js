/**
 * Indian Timezone Utility Functions
 * Handles all date/time operations in Indian Standard Time (IST)
 */

const INDIAN_TIMEZONE = 'Asia/Kolkata'

class TimezoneUtil {
    /**
     * Get current IST date
     * @returns {Date} Current date in IST
     */
    static now() {
        return new Date(new Date().toLocaleString('en-US', { timeZone: INDIAN_TIMEZONE }))
    }

    /**
     * Convert any date to IST
     * @param {Date|string} date - Date to convert
     * @returns {Date} Date in IST
     */
    static toIST(date) {
        const inputDate = new Date(date)
        return new Date(inputDate.toLocaleString('en-US', { timeZone: INDIAN_TIMEZONE }))
    }

    /**
     * Get start of day in IST
     * @param {Date|string} date - Optional date, defaults to current
     * @returns {Date} Start of day in IST
     */
    static startOfDay(date = null) {
    const d = date ? new Date(date) : new Date()
    return new Date(
        Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate() - (INDIAN_TIMEZONE === 'Asia/Kolkata' ? 1 : 0),
            18, 30, 0, 0
        )
    )
}

    /**
     * Get end of day in IST
     * @param {Date|string} date - Optional date, defaults to current
     * @returns {Date} End of day in IST
     */
    static endOfDay(date = null) {
        const start = this.startOfDay(date)
        return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
    }

    /**
     * Add days to IST date
     * @param {number} days - Number of days to add
     * @param {Date|string} date - Base date, defaults to current
     * @returns {Date} New date in IST
     */
    static addDays(days, date = null) {
        const istDate = date ? this.toIST(date) : this.now()
        istDate.setDate(istDate.getDate() + days)
        return istDate
    }

    /**
     * Add months to IST date
     * @param {number} months - Number of months to add
     * @param {Date|string} date - Base date, defaults to current
     * @returns {Date} New date in IST
     */
    static addMonths(months, date = null) {
        const istDate = date ? this.toIST(date) : this.now()
        istDate.setMonth(istDate.getMonth() + months)
        return istDate
    }

    /**
     * Format date for IST display
     * @param {Date|string} date - Date to format
     * @param {string} format - Format type ('date', 'datetime', 'time', 'time24')
     * @returns {string} Formatted date string
     */
    static format(date, format = 'datetime') {
        const istDate = this.toIST(date)
        
        const options = {
            timeZone: INDIAN_TIMEZONE,
            hour12: false // Always use 24-hour format
        }

        switch (format) {
            case 'date':
                options.year = 'numeric'
                options.month = '2-digit'
                options.day = '2-digit'
                break
            case 'time':
            case 'time24':
                options.hour = '2-digit'
                options.minute = '2-digit'
                options.second = '2-digit'
                break
            case 'datetime':
            default:
                options.year = 'numeric'
                options.month = '2-digit'
                options.day = '2-digit'
                options.hour = '2-digit'
                options.minute = '2-digit'
                options.second = '2-digit'
        }

        return new Intl.DateTimeFormat('en-IN', options).format(istDate)
    }

    /**
     * Get time in HH:MM format (24-hour)
     * @param {Date|string} date - Date to format
     * @returns {string} Time in HH:MM format
     */
    static getTimeString(date = null) {
        const istDate = date ? this.toIST(date) : this.now()
        const hours = istDate.getHours().toString().padStart(2, '0')
        const minutes = istDate.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
    }

    /**
     * Parse time string (HH:MM) and create date with current IST date
     * @param {string} timeString - Time in HH:MM format
     * @param {Date|string} baseDate - Base date, defaults to current
     * @returns {Date} Date with specified time in IST
     */
    static parseTimeString(timeString, baseDate = null) {
        const [hours, minutes] = timeString.split(':').map(Number)
        const istDate = baseDate ? this.toIST(baseDate) : this.now()
        istDate.setHours(hours, minutes, 0, 0)
        return istDate
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
        const now = this.now()
        let startDate, endDate

        switch (period) {
            case 'today':
                startDate = this.startOfDay()
                endDate = this.endOfDay()
                break
            case 'week':
                startDate = this.startOfDay(this.addDays(-6))
                endDate = this.endOfDay()
                break
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
                break
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1)
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
                break
            default:
                startDate = this.startOfDay()
                endDate = this.endOfDay()
        }

        return { startDate, endDate }
    }

    /**
     * Check if date is in IST business hours (9 AM - 6 PM)
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if in business hours
     */
    static isBusinessHours(date = null) {
        const istDate = date ? this.toIST(date) : this.now()
        const hour = istDate.getHours()
        return hour >= 9 && hour < 18
    }

    /**
     * Get next business day in IST
     * @param {Date|string} date - Base date
     * @returns {Date} Next business day
     */
    static nextBusinessDay(date = null) {
        let nextDay = this.addDays(1, date)
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
            nextDay = this.addDays(1, nextDay)
        }
        
        return nextDay
    }

    /**
     * Calculate age in days from IST date
     * @param {Date|string} date - Start date
     * @returns {number} Age in days
     */
    static ageInDays(date) {
        const startDate = this.toIST(date)
        const currentDate = this.now()
        const diffTime = Math.abs(currentDate - startDate)
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    /**
     * Get financial year dates (April 1 - March 31) in IST
     * @param {number} year - Optional year, defaults to current FY
     * @returns {Object} {startDate, endDate, year}
     */
    static getFinancialYear(year = null) {
        const currentDate = this.now()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth()
        
        // Determine financial year
        let fyYear
        if (year) {
            fyYear = year
        } else {
            fyYear = currentMonth >= 3 ? currentYear : currentYear - 1
        }
        
        return {
            startDate: new Date(fyYear, 3, 1), // April 1
            endDate: new Date(fyYear + 1, 2, 31, 23, 59, 59, 999), // March 31
            year: fyYear
        }
    }
}

export default TimezoneUtil