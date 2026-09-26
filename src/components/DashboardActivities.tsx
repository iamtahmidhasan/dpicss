'use client'

import { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'
import type { Activity } from '@/payload-types'

export function DashboardActivities() {
  const { config } = useConfig()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Use fetch with credentials to include admin authentication
        const response = await fetch(
          `${config.serverURL}/api/activities?limit=10&sort=-createdAt&depth=2`,
          {
            credentials: 'include', // Include cookies for authentication
          },
        )
        if (response.ok) {
          const result = await response.json()
          setActivities(result.docs || [])
        } else {
          console.error('Failed to fetch activities:', response.status, response.statusText)
        }
      } catch {
        // Silently fail - activities are not critical
      } finally {
        setLoading(false)
      }
    }

    if (config?.serverURL) {
      fetchActivities()
    }
  }, [config])

  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      publish: 'Published',
      login: 'Logged in',
      logout: 'Logged out',
    }
    return actionMap[action] || action
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const activityDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (loading) {
    return (
      <div className="dashboard-card">
        <h3>Recent Activities</h3>
        <div className="loading">Loading activities...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-card">
      <h3>Recent Activities</h3>
      <div className="activities-list">
        {activities.length === 0 ? (
          <p className="no-activities">No recent activities</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-header">
                <span className="activity-user">
                  {activity.user && typeof activity.user === 'object'
                    ? activity.user.email
                    : 'Unknown User'}
                </span>
                <span className="activity-action">{formatAction(activity.action)}</span>
                <span className="activity-collection">{activity.collectionName}</span>
              </div>
              <div className="activity-details">
                {activity.documentTitle && (
                  <span className="activity-title">"{activity.documentTitle}"</span>
                )}
                <span className="activity-time">{formatTime(activity.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <style jsx>{`
        .dashboard-card {
          background: var(--theme-elevation-50);
          border: 1px solid var(--theme-border-color);
          border-radius: var(--border-radius);
          padding: var(--base);
          margin-bottom: var(--base);
        }

        h3 {
          margin: 0 0 var(--base) 0;
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--theme-text);
        }

        .loading,
        .no-activities {
          color: var(--theme-text-muted);
          font-style: italic;
          padding: var(--base);
          text-align: center;
        }

        .activities-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .activity-item {
          padding: calc(var(--base) / 2);
          border-bottom: 1px solid var(--theme-border-color);
          margin-bottom: calc(var(--base) / 2);
        }

        .activity-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .activity-header {
          display: flex;
          align-items: center;
          gap: calc(var(--base) / 2);
          margin-bottom: calc(var(--base) / 4);
        }

        .activity-user {
          font-weight: 600;
          color: var(--theme-text);
        }

        .activity-action {
          background: var(--theme-success-500);
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .activity-collection {
          background: var(--theme-elevation-200);
          color: var(--theme-text);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .activity-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: var(--theme-text-muted);
        }

        .activity-title {
          font-style: italic;
          color: var(--theme-text);
        }

        .activity-time {
          font-size: 0.8rem;
          color: var(--theme-text-muted);
        }
      `}</style>
    </div>
  )
}

export default DashboardActivities
