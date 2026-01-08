import React, { useState } from 'react'
import { Send, Bell, Loader2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { sendBroadcastNotificationApi } from '../../service/api.service'
import toast from 'react-hot-toast'

function PushNotifications() {
    const [formData, setFormData] = useState({
        title: '',
        body: ''
    })
    const [loading, setLoading] = useState(false)

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.title.trim() || !formData.body.trim()) {
            toast.error('Title and message body are required')
            return
        }

        setLoading(true)
        try {
            const response = await sendBroadcastNotificationApi(formData)
            toast.success(response.message || 'Notification sent successfully')
            setFormData({ title: '', body: '' }) // Reset form
        } catch (error) {
            console.error('Error sending notification:', error)
            toast.error(error.response?.data?.message || 'Failed to send notification')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Push Notifications</h1>
                    <p className="text-gray-400 mt-1">Send broadcast notifications to all users</p>
                </div>
            </div>

            <div className=" gap-6">
                <Card className="p-6">
                    <Card.Header>
                        <Card.Title className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-orange-400" />
                            Compose Notification
                        </Card.Title>
                    </Card.Header>

                    <Card.Content>
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6">
                            <div>
                                <Input
                                    label="Title"
                                    name="title"
                                    placeholder="e.g., Special Offer! 50% Off"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={100}
                                />
                                <p className="text-xs text-gray-500 mt-1 text-right">{formData.title.length}/100</p>
                            </div>

                            <div>
                                <Input.TextArea
                                    label="Message Body"
                                    name="body"
                                    placeholder="e.g., Get flat 50% off on all subscriptions today only! Use code SAVE50."
                                    value={formData.body}
                                    onChange={handleInputChange}
                                    rows={5}
                                    required
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-500 mt-1 text-right">{formData.body.length}/500</p>
                            </div>

                            <div className="pt-4 border-t border-gray-700/50">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    loading={loading}
                                    fullWidth
                                    icon={Send}
                                    className="bg-orange-600 hover:bg-orange-700">
                                    Send Broadcast
                                </Button>
                            </div>
                        </form>
                    </Card.Content>
                </Card>
            </div>
        </div>
    )
}

export default PushNotifications

