import React from 'react';
import { Link } from 'react-router-dom';

interface ProfileProps {
  data?: any;
}

const Profile: React.FC<ProfileProps> = ({ data }) => {
  return (
    <div>
      <h1>User Profile</h1>
      <p>This page data is fetched by Express Middleware!</p>
      
      {data && data.user && (
        <div style={{ padding: '15px', background: '#fff3e0', marginTop: '10px', borderLeft: '4px solid #ff9800' }}>
          <h3>User Info (Injected by Middleware):</h3>
          <p><strong>Username:</strong> {data.user.username}</p>
          <p><strong>Email:</strong> {data.user.email}</p>
          <p><strong>Role:</strong> {data.user.role}</p>
        </div>
      )}

      <nav style={{ marginTop: '20px' }}>
        <Link to="/">Go back Home</Link>
      </nav>
    </div>
  );
};

export default Profile;
