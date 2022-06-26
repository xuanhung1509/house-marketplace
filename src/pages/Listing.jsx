import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

// Leaflet Map
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// Swiper Slider Images
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import Spinner from '../components/Spinner';
import shareIcon from '../assets/svg/shareIcon.svg';

function Listing() {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharedLinkCopied, setSharedLinkCopied] = useState(false);

  const { listingId } = useParams();

  const auth = getAuth();

  const regexPattern = /\B(?=(\d{3})+(?!\d))/g;
  const formatPrice = (price) => {
    return price.toString().replace(regexPattern, ',');
  };

  useEffect(() => {
    const fetchListing = async () => {
      const docRef = doc(db, 'listings', listingId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setListing(docSnap.data());
        setLoading(false);
      } else {
        console.log('No such document');
      }
    };

    fetchListing();
  }, [listingId]);

  if (loading) return <Spinner />;

  const {
    name,
    type,
    location,
    offer,
    regularPrice,
    discountedPrice,
    parking,
    furnished,
    bathrooms,
    bedrooms,
    geolocation,
    imgUrls,
    userRef,
  } = listing;

  return (
    <main>
      <Swiper
        modules={[Navigation, Pagination, Scrollbar, A11y]}
        slidesPerView={1}
        scrollbar={{ draggable: true }}
        pagination={{ clickable: true }}
      >
        {imgUrls.map((url) => (
          <SwiperSlide key={url}>
            <div
              className='swiperSlideDiv'
              style={{
                background: `url(${url}) no-repeat center center/cover`,
                height: '250px',
              }}
            ></div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div
        className='shareIconDiv'
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          setSharedLinkCopied(true);
          setTimeout(() => {
            setSharedLinkCopied(false);
          }, 2000);
        }}
      >
        <img src={shareIcon} alt='' />
      </div>

      {sharedLinkCopied && <p className='linkCopied'>Link Copied</p>}

      <div className='listingDetails'>
        <p className='listingName'>
          {name} - $
          {offer ? formatPrice(discountedPrice) : formatPrice(regularPrice)}
        </p>

        <p className='listingLocation'>{location}</p>
        <p className='listingType'>For {type === 'rent' ? 'Rent' : 'Sale'}</p>
        {offer && (
          <div className='discountPrice'>
            ${formatPrice(regularPrice - discountedPrice)} discount
          </div>
        )}

        <ul className='listingDetailsList'>
          <li>{bedrooms > 1 ? `${bedrooms} Bedrooms` : '1 Bedroom'}</li>
          <li>{bathrooms > 1 ? `${bathrooms} Bathrooms` : '1 Bathroom'}</li>
          <li>{parking && 'Parking Spot'}</li>
          <li>{furnished && 'Furnished'}</li>
        </ul>

        <p className='listingLocationTitle'>Location</p>
        <div className='leafletContainer'>
          <MapContainer
            center={[geolocation.lat, geolocation.lng]}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            <Marker position={[geolocation.lat, geolocation.lng]}>
              <Popup>{location}</Popup>
            </Marker>
          </MapContainer>
        </div>

        {auth.currentUser?.uid !== userRef && (
          <Link
            to={`/contact/${userRef}?listingName=${name}`}
            className='primaryButton'
          >
            Contact Landlord
          </Link>
        )}
      </div>
    </main>
  );
}

export default Listing;
