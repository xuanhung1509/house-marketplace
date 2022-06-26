import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.config';
import googleIcon from '../assets/svg/googleIcon.svg';
import { toast } from 'react-toastify';

function OAuth() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleGoogleClick = async () => {
    try {
      // Sign in/up user with Google
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check for user
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      // If user not exits, add to database
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          timestamp: serverTimestamp(),
        });
      }

      navigate('/');
    } catch (err) {
      toast.error('Could not authorize with Google');
    }
  };

  return (
    <div className='socialLogin'>
      <p>Sign {pathname === '/sign-in' ? 'in' : 'up'} with</p>
      <button className='socialIconDiv' onClick={handleGoogleClick}>
        <img src={googleIcon} alt='google' className='socialIconImg' />
      </button>
    </div>
  );
}

export default OAuth;
