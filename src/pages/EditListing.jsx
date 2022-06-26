import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.config';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';

function EditListing() {
  const geolocationEnabled = true;

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [formData, setFormData] = useState({
    type: 'rent',
    name: '',
    bathrooms: 1,
    bedrooms: 1,
    parking: false,
    offer: false,
    regularPrice: 0,
    discountedPrice: 0,
    furnished: false,
    address: '',
    latitude: '',
    longitude: '',
    images: null,
  });

  const {
    type,
    name,
    bathrooms,
    bedrooms,
    parking,
    offer,
    regularPrice,
    discountedPrice,
    furnished,
    address,
    latitude,
    longitude,
    images,
  } = formData;

  const { listingId } = useParams();
  const auth = getAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value, files } = e.target;

    // Boolean
    let bool = null;
    if (value === 'true') {
      bool = true;
    } else if (value === 'false') {
      bool = false;
    }

    // Files
    if (files) {
      setFormData((prevState) => ({
        ...prevState,
        images: files,
      }));
    }

    // Text
    if (!files) {
      setFormData((prevState) => ({
        ...prevState,
        [id]: bool ?? value,
      }));
    }
  };

  const handleDeleteImage = (url) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      formData.imgUrls = formData.imgUrls.filter((item) => item !== url);
      setFormData((prevState) => ({
        ...prevState,
        imgUrls: formData.imgUrls,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    if (discountedPrice >= regularPrice) {
      setLoading(false);
      toast.error('Discounted price must be smaller then regular price.');
      return;
    }

    console.log(!images?.length && !formData.imgUrls.length);
    if (images?.length + formData.imgUrls.length > 6) {
      setLoading(false);
      toast.error('Maximum 6 images exceed.');
      return;
    }

    if (!images?.length && !formData.imgUrls.length) {
      setLoading(false);
      toast.error('At least 1 image required.');
      return;
    }

    let geolocation = {};

    if (geolocationEnabled) {
      const response = await fetch(
        `http://api.positionstack.com/v1/forward?access_key=${process.env.REACT_APP_GEOCODE_API_KEY}&query=${address}&limit=1`
      );
      const { data } = await response.json();

      if (data.length > 0) {
        geolocation.lat = data[0].latitude;
        geolocation.lng = data[0].longitude;
      } else {
        setLoading(false);
        toast.error('Please enter a valid address.');
        return;
      }
    } else {
      geolocation.lat = latitude;
      geolocation.lng = longitude;
    }

    // Upload image to Firebase Storage
    const storeImage = async (img) => {
      return new Promise((resolve, reject) => {
        const storage = getStorage();
        const fileName = `${uuidv4()}-${auth.currentUser.uid}-${img.name}`;
        const storageRef = ref(storage, 'images/' + fileName);

        const uploadTask = uploadBytesResumable(storageRef, img);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
              case 'paused':
                console.log('Upload is paused');
                break;
              case 'running':
                console.log('Upload is running');
                break;
              default:
                break;
            }
          },
          (err) => reject(err),
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
              resolve(downloadURL)
            );
          }
        );
      });
    };

    let newImgUrls = null;

    if (images?.length > 0) {
      newImgUrls = await Promise.all(
        [...images].map((img) => storeImage(img))
      ).catch(() => {
        setLoading(false);
        toast.error('Could not upload images.');
        return;
      });
    }

    const formDataCopy = {
      ...formData,
      bathrooms: +bathrooms,
      bedrooms: +bedrooms,
      regularPrice: +regularPrice,
      discountedPrice: +discountedPrice,
      location: address,
      imgUrls: newImgUrls
        ? [...formData.imgUrls, ...newImgUrls]
        : formData.imgUrls,
      geolocation,
      timestamp: serverTimestamp(),
    };

    // Clean up data
    delete formDataCopy.longitude;
    delete formDataCopy.latitude;
    delete formDataCopy.images;
    !formDataCopy.offer && delete formDataCopy.discountedPrice;

    // Update listing
    try {
      const docRef = doc(db, 'listings', listingId);
      await updateDoc(docRef, formDataCopy);
      setLoading(false);
      toast.success('Successfully updated listing.');
      navigate(`/category/${formDataCopy.type}/${docRef.id}`);
    } catch (err) {
      setLoading(false);
      toast.error('Could not update listing.');
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setFormData({
          ...formData,
          userRef: user.uid,
        });
      } else {
        navigate('/sign-in');
      }
    });
    // eslint-disable-next-line
  }, []);

  // Redirect if listing is not user's
  useEffect(() => {
    if (listing && listing.data.userRef !== auth.currentUser.uid) {
      toast.error('You cannot edit that listing');
      navigate('/');
    }
    // eslint-disable-next-line
  }, [listingId, listing, auth?.currentUser?.uid]);

  // Fetch listing to update
  useEffect(() => {
    const fetchListing = async () => {
      const listingRef = doc(db, 'listings', listingId);
      const docSnap = await getDoc(listingRef);

      if (docSnap.exists()) {
        setListing({
          data: docSnap.data(),
          id: docSnap.id,
        });

        setFormData({
          ...docSnap.data(),
          address: docSnap.data().location,
          longitude: docSnap.data().geolocation.lng,
          latitude: docSnap.data().geolocation.lat,
        });

        setLoading(false);
      } else {
        setLoading(false);
        toast.error('Listing does not exist!');
      }
    };

    fetchListing();
  }, [listingId]);

  if (loading) return <Spinner />;

  return (
    <div className='profile'>
      <header>
        <p className='pageHeader'>Edit your Listing</p>
      </header>

      <main>
        <form onSubmit={handleSubmit}>
          <label className='formLabel'>Sell/ Rent</label>
          <div className='formButtons'>
            <button
              type='button'
              id='type'
              className={type === 'sale' ? 'formButtonActive' : 'formButton'}
              value='sale'
              onClick={handleChange}
            >
              Sell
            </button>
            <button
              type='button'
              id='type'
              className={type === 'rent' ? 'formButtonActive' : 'formButton'}
              value='rent'
              onClick={handleChange}
            >
              Rent
            </button>
          </div>

          <label className='formLabel'>Name</label>
          <input
            type='text'
            id='name'
            className='formInputName'
            minLength='10'
            maxLength='32'
            required
            value={name}
            onChange={handleChange}
          />

          <div className='formRooms flex'>
            <div>
              <label className='formLabel'>Bedrooms</label>
              <input
                type='number'
                id='bedrooms'
                className='formInputSmall'
                min='1'
                max='50'
                required
                value={bedrooms}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className='formLabel'>Bathrooms</label>
              <input
                type='number'
                id='bathrooms'
                className='formInputSmall'
                min='1'
                max='50'
                required
                value={bathrooms}
                onChange={handleChange}
              />
            </div>
          </div>

          <label className='formLabel'>Parking Spot</label>
          <div className='formButtons'>
            <button
              type='button'
              id='parking'
              className={parking ? 'formButtonActive' : 'formButton'}
              value={true}
              onClick={handleChange}
            >
              Yes
            </button>
            <button
              type='button'
              id='parking'
              className={!parking ? 'formButtonActive' : 'formButton'}
              value={false}
              onClick={handleChange}
            >
              No
            </button>
          </div>

          <label className='formLabel'>Furnished</label>
          <div className='formButtons'>
            <button
              type='button'
              id='furnished'
              className={furnished ? 'formButtonActive' : 'formButton'}
              value={true}
              onClick={handleChange}
            >
              Yes
            </button>
            <button
              type='button'
              id='furnished'
              className={!furnished ? 'formButtonActive' : 'formButton'}
              value={false}
              onClick={handleChange}
            >
              No
            </button>
          </div>

          <label className='formLabel'>Address</label>
          <textarea
            id='address'
            className='formInputAddress'
            required
            value={address}
            onChange={handleChange}
          ></textarea>

          {!geolocationEnabled && (
            <div className='formLatLng flex'>
              <div>
                <label className='formLabel'>Latitude</label>
                <input
                  type='number'
                  id='latitude'
                  className='formInputSmall'
                  required
                  value={latitude}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className='formLabel'>Longtitude</label>
                <input
                  type='number'
                  id='longitude'
                  className='formInputSmall'
                  required
                  value={longitude}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <label className='formLabel'>Offer</label>
          <div className='formButtons'>
            <button
              type='button'
              id='offer'
              className={offer ? 'formButtonActive' : 'formButton'}
              value={true}
              onClick={handleChange}
            >
              Yes
            </button>
            <button
              type='button'
              id='offer'
              className={!offer ? 'formButtonActive' : 'formButton'}
              value={false}
              onClick={handleChange}
            >
              No
            </button>
          </div>

          <div className='formLabel'>Regular Price</div>
          <div className='formPriceDiv'>
            <input
              type='number'
              id='regularPrice'
              className='formInputSmall'
              min='50'
              max='750000000'
              required
              value={regularPrice}
              onChange={handleChange}
            />
            {type === 'rent' && <p className='formPriceText'>$ / Month</p>}
          </div>

          {offer && (
            <>
              <label className='formLabel'>Discounted Price</label>
              <input
                type='number'
                id='discountedPrice'
                className='formInputSmall'
                min='50'
                max='750000000'
                required={offer}
                value={discountedPrice}
                onChange={handleChange}
              />
            </>
          )}

          <label className='formLabel'>Images</label>

          <div className='imgGallery'>
            {formData.imgUrls.map((url) => (
              <div key={url} className='imgWrapper'>
                <span
                  className='iconDelete'
                  onClick={() => {
                    handleDeleteImage(url);
                  }}
                >
                  X
                </span>
                <img src={url} alt='' />
              </div>
            ))}
          </div>

          <p className='imagesInfo'>
            The first image will be the cover (max 6).
          </p>
          <input
            type='file'
            id='images'
            className='formInputFile'
            accept='.jpg, .png, .jpeg'
            multiple
            max='6'
            onChange={handleChange}
          />

          <button type='submit' className='primaryButton createListingButton'>
            Update Listing
          </button>
        </form>
      </main>
    </div>
  );
}

export default EditListing;
