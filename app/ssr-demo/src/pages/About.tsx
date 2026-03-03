import React from 'react';
import { Link } from 'react-router-dom';

interface AboutProps {
  data?: any;
}

const About: React.FC<AboutProps> = ({ data }) => {
  const [count, setCount] = React.useState(0);
  
  return (
    <div>
      <h1>About Page</h1>
      <p>This is the About Page.</p>
      
      {data && data.message && (
        <div style={{ padding: '10px', background: '#e0f7fa', marginTop: '10px', borderLeft: '4px solid #00acc1' }}>
          <h3>Server Data:</h3>
          <p><strong>Message:</strong> {data.message}</p>
          <p><strong>Description:</strong> {data.description}</p>
        </div>
      )}

      <div style={{ marginTop: '10px' }}>
        <p>Interactive Counter: {count}</p>
        <button onClick={() => setCount(count + 1)}>Increment</button>
      </div>
      <nav style={{ marginTop: '20px' }}>
        <Link to="/">Go back Home</Link>
      </nav>
    </div>
  );
};

export default About;
