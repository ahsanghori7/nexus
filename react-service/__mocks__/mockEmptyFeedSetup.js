// Mock for Empty Feed components
import React from 'react';

// Mock empty feed configuration
export const mockEmptyFeedConfig = {
  opportunities: {
    title: 'No Opportunities Yet',
    subtitle: 'Complete your prequalification to start receiving opportunities',
    img: 'mock-building-icon.svg'
  },
  enquiries: {
    title: 'No Enquiries Yet',
    subtitle: 'Complete your prequalification to start receiving enquiries',
    img: 'mock-list-icon.svg'
  },
  rooms: {
    title: 'No Rooms Yet',
    subtitle: 'Complete your prequalification to start receiving rooms',
    img: 'mock-chat-icon.svg'
  }
};

// Mock i18next translations
export const mockI18nTranslations = {
  'empty-feed-opportunities-title': 'No Opportunities Yet',
  'empty-feed-opportunities-subtitle1': 'Complete your',
  'empty-feed-opportunities-subtitle2': 'prequalification',
  'empty-feed-enquiries-title': 'No Enquiries Yet',
  'empty-feed-enquiries-subtitle1': 'Complete your',
  'empty-feed-enquiries-subtitle2': 'prequalification',
  'empty-feed-rooms-title': 'No Rooms Yet',
  'empty-feed-rooms-subtitle1': 'Complete your',
  'empty-feed-rooms-subtitle2': 'prequalification',
  'complete-prequalification': 'Complete Prequalification'
};

// Mock URL helpers
export const mockUrlHelpers = {
  getUrl: jest.fn((app, path) => `/${app}${path}`),
  goTo: jest.fn()
};
