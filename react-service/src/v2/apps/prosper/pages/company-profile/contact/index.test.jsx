import React from 'react';
import { render, screen } from '@testing-library/react';
import Contact from './index';

// Mock the CRM components
jest.mock('v2/apps/prosper/shared/crm-components/About', () => ({ 
  title, 
  fontTitleSx, 
  descSx, 
  src, 
  displayName, 
  jobTitle, 
  loading, 
  ...props 
}) => {
  if (loading) {
    return <div data-testid="about-loading">Loading about...</div>;
  }

  return (
    <div 
      data-testid="about"
      data-title={title}
      data-display-name={displayName}
      data-job-title={jobTitle}
      {...props}
    >
      {src && <img src={src} alt={`${title}-icon`} />}
      <h3>{title}</h3>
      {displayName && <div data-testid="display-name">{displayName}</div>}
      {jobTitle && <div data-testid="job-title">{jobTitle}</div>}
    </div>
  );
});

jest.mock('v2/apps/prosper/shared/crm-components/Item', () => ({ 
  icon, type, value, url, loading, mt, gridSx, ...props 
}) => {
  if (loading) {
    return <div data-testid={`item-loading-${type}`}>Loading...</div>;
  }

  if (!value) {
    return null;
  }

  return (
    <div 
      data-testid={`item-${type}`}
      data-value={value}
      data-url={url}
      {...props}
    >
      {icon && <img src={icon} alt={`${type}-icon`} />}
      {url ? (
        <a href={value} target="_blank" rel="noopener noreferrer">
          {value}
        </a>
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
});

// Mock clink-components constants
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconContractor: 'https://example.com/contractor-icon.png',
      iconPurplePhone: 'https://example.com/phone-icon.png',
      iconPurpleMail: 'https://example.com/mail-icon.png',
      iconPurpleLocation: 'https://example.com/location-icon.png',
      iconPurpleWebsite: 'https://example.com/website-icon.png'
    },
    colors: {
      prosper: {
        prosperGrayBorder2: '#E5E5E5'
      }
    }
  }
}));

describe('Contact Component', () => {
  const defaultProps = {
    data: {
      landline: '555-123-4567',
      address: '123 Main St, City, State 12345',
      users: [
        {
          id: '1',
          firstname: 'John',
          lastname: 'Doe',
          display_name: 'John Doe',
          email: 'john.doe@example.com',
          job_title: 'Manager'
        }
      ]
    },
    website: 'https://example.com',
    idContact: 0,
    loading: false
  };

  it('should render without crashing', () => {
    render(<Contact {...defaultProps} />);
    
    expect(screen.getByTestId('about')).toBeInTheDocument();
    expect(screen.getByText('contacts')).toBeInTheDocument();
  });

  it('should render contact information when data is provided', () => {
    render(<Contact {...defaultProps} />);
    
    // About section
    expect(screen.getByTestId('about')).toBeInTheDocument();
    expect(screen.getByTestId('display-name')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('job-title')).toHaveTextContent('Manager');
    
    // Contact items
    expect(screen.getByTestId('item-profile-mail')).toBeInTheDocument();
    expect(screen.getByTestId('item-profile-landline-number')).toBeInTheDocument();
    expect(screen.getByTestId('item-profile-address')).toBeInTheDocument();
    expect(screen.getByTestId('item-profile-website')).toBeInTheDocument();
  });

  it('should handle specific contact ID', () => {
    const dataWithMultipleUsers = {
      ...defaultProps.data,
      users: [
        {
          id: '1',
          firstname: 'John',
          lastname: 'Doe',
          display_name: 'John Doe',
          email: 'john.doe@example.com',
          job_title: 'Manager'
        },
        {
          id: '2',
          firstname: 'Jane',
          lastname: 'Smith',
          display_name: 'Jane Smith',
          email: 'jane.smith@example.com',
          job_title: 'Director'
        }
      ]
    };

    render(<Contact {...defaultProps} data={dataWithMultipleUsers} idContact={2} />);
    
    expect(screen.getByTestId('display-name')).toHaveTextContent('Jane Smith');
    expect(screen.getByTestId('job-title')).toHaveTextContent('Director');
  });

  it('should construct display name from firstname and lastname when display_name is not provided', () => {
    const dataWithoutDisplayName = {
      ...defaultProps.data,
      users: [
        {
          id: '1',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          job_title: 'Manager'
        }
      ]
    };

    render(<Contact {...defaultProps} data={dataWithoutDisplayName} />);
    
    expect(screen.getByTestId('display-name')).toHaveTextContent('John Doe');
  });

  it('should handle missing lastname', () => {
    const dataWithFirstnameOnly = {
      ...defaultProps.data,
      users: [
        {
          id: '1',
          firstname: 'John',
          email: 'john.doe@example.com',
          job_title: 'Manager'
        }
      ]
    };

    render(<Contact {...defaultProps} data={dataWithFirstnameOnly} />);
    
    expect(screen.getByTestId('display-name')).toHaveTextContent('John ');
  });

  it('should handle missing firstname', () => {
    const dataWithLastnameOnly = {
      ...defaultProps.data,
      users: [
        {
          id: '1',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          job_title: 'Manager'
        }
      ]
    };

    render(<Contact {...defaultProps} data={dataWithLastnameOnly} />);
    
    expect(screen.getByTestId('display-name')).toHaveTextContent(' Doe');
  });

  it('should handle empty data gracefully', () => {
    render(<Contact {...defaultProps} data={null} />);
    
    expect(screen.getByTestId('about')).toBeInTheDocument();
    expect(screen.queryByTestId('item-profile-mail')).not.toBeInTheDocument();
    expect(screen.queryByTestId('item-profile-landline-number')).not.toBeInTheDocument();
    expect(screen.queryByTestId('item-profile-address')).not.toBeInTheDocument();
  });

  it('should handle missing users array', () => {
    const dataWithoutUsers = {
      landline: '555-123-4567',
      address: '123 Main St, City, State 12345'
    };

    render(<Contact {...defaultProps} data={dataWithoutUsers} />);
    
    expect(screen.getByTestId('about')).toBeInTheDocument();
    expect(screen.getByTestId('item-profile-landline-number')).toBeInTheDocument();
    expect(screen.getByTestId('item-profile-address')).toBeInTheDocument();
  });

  it('should show loading state when loading is true', () => {
    render(<Contact {...defaultProps} loading={true} />);
    
    expect(screen.getByTestId('about-loading')).toBeInTheDocument();
    expect(screen.getByTestId('item-loading-profile-mail')).toBeInTheDocument();
    expect(screen.getByTestId('item-loading-profile-landline-number')).toBeInTheDocument();
    expect(screen.getByTestId('item-loading-profile-address')).toBeInTheDocument();
    expect(screen.getByTestId('item-loading-profile-website')).toBeInTheDocument();
  });

  it('should handle missing website', () => {
    render(<Contact {...defaultProps} website={null} />);
    
    expect(screen.queryByTestId('item-profile-website')).not.toBeInTheDocument();
  });

  it('should handle default idContact value', () => {
    const { idContact, ...propsWithoutIdContact } = defaultProps;
    render(<Contact {...propsWithoutIdContact} />);
    
    // Should use first user from array
    expect(screen.getByTestId('display-name')).toHaveTextContent('John Doe');
  });

  it('should handle default loading value', () => {
    const { loading, ...propsWithoutLoading } = defaultProps;
    render(<Contact {...propsWithoutLoading} />);
    
    // Should not show loading state
    expect(screen.queryByTestId('about-loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('about')).toBeInTheDocument();
  });

  it('should render website as URL when provided', () => {
    render(<Contact {...defaultProps} />);
    
    const websiteItem = screen.getByTestId('item-profile-website');
    expect(websiteItem).toHaveAttribute('data-url', 'true');
    expect(websiteItem).toHaveAttribute('data-value', 'https://example.com');
  });
});