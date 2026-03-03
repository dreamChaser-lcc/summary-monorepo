import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

interface HomeProps {
  data?: any;
}


const Home: React.FC<HomeProps> = ({ data }) => {
  
  useEffect(() => {
    console.log('Home component mounted');
  }, []);

  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the SSR Demo Home Page.</p>
      {data && (
        <div style={{ padding: '10px', background: '#f0f0f0', marginTop: '10px' }}>
          <h3>Server Data:</h3>
          <p><strong>Title:</strong> {data.title}</p>
          <p><strong>Content:</strong> {data.content}</p>
        </div>
      )}
      <nav style={{ marginTop: '20px' }}>
        <Link to="/about">Go to About</Link>
      </nav>
    </div>
  );
};

export default Home;
