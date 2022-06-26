import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { toast } from 'react-toastify';

function Contact() {
  const [landlord, setLandlord] = useState(null);
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();

  const { landlordId } = useParams();

  const handleChange = (e) => setMessage(e.target.value);

  useEffect(() => {
    const fetchLandlord = async () => {
      const docRef = doc(db, 'users', landlordId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setLandlord(docSnap.data());
      } else {
        toast.error('Could not contact landlord');
      }
    };

    fetchLandlord();
  }, [landlordId]);

  return (
    <div className='pageContainer'>
      <header>
        <p className='pageHeader'>Contact Landlord</p>
      </header>

      {landlord !== null && (
        <main>
          <div className='contactLandlord'>
            <p className='landlordName'>{landlord?.name}</p>
          </div>

          <form className='messageForm'>
            <div className='messageDiv'>
              <label htmlFor='message' className='messageLabel'>
                Message
              </label>
              <textarea
                id='message'
                className='textarea'
                value={message}
                onChange={handleChange}
              ></textarea>
            </div>

            <a
              href={`mailto:${landlord.email}?subject=${searchParams.get(
                'listingName'
              )}&body=${message}`}
            >
              <button type='button' className='primaryButton'>
                Send Message
              </button>
            </a>
          </form>
        </main>
      )}
    </div>
  );
}

export default Contact;
