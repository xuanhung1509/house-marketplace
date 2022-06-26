import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import ListingItem from '../components/ListingItem';

function Category() {
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetchedListing, setLastFetchedListing] = useState(null);
  const { categoryName } = useParams();

  const handleFetchMoreListings = async () => {
    try {
      // Create a ref to the listings collection
      const listingsRef = collection(db, 'listings');

      // Create a query against the collection
      const q = query(
        listingsRef,
        where('type', '==', categoryName),
        orderBy('timestamp', 'desc'),
        startAfter(lastFetchedListing),
        limit(10)
      );

      // Execute the query
      const listings = [];
      const querySnap = await getDocs(q);

      querySnap.forEach((doc) =>
        listings.push({
          id: doc.id,
          data: doc.data(),
        })
      );
      setListings((prevState) => [...prevState, ...listings]);
      setLoading(false);

      // Check if any listings left
      const all = query(
        listingsRef,
        where('type', '==', categoryName),
        orderBy('timestamp', 'desc')
      );
      const allQuerySnap = await getDocs(all);
      if (listings?.length < allQuerySnap.docs.length) {
        // if yes, show 'Load More'
        const lastVisible = querySnap.docs[querySnap.docs.length - 1];
        setLastFetchedListing(lastVisible);
      } else {
        // if not, do not show 'Load More'
        setLastFetchedListing(null);
      }
    } catch (err) {
      toast.error('Could not fetch listings.');
    }
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        // Create a ref to the listings collection
        const listingsRef = collection(db, 'listings');

        // Create a query against the collection
        const q = query(
          listingsRef,
          where('type', '==', categoryName),
          orderBy('timestamp', 'desc'),
          limit(10)
        );

        // Execute the query
        const listings = [];
        const querySnap = await getDocs(q);

        querySnap.forEach((doc) =>
          listings.push({
            id: doc.id,
            data: doc.data(),
          })
        );
        setListings(listings);
        setLoading(false);

        // Check if any listings left
        const all = query(
          listingsRef,
          where('type', '==', categoryName),
          orderBy('timestamp', 'desc')
        );
        const allQuerySnap = await getDocs(all);
        if (listings?.length < allQuerySnap.docs.length) {
          // if yes, show 'Load More'
          const lastVisible = querySnap.docs[querySnap.docs.length - 1];
          setLastFetchedListing(lastVisible);
        } else {
          // if not, do not show 'Load More'
          setLastFetchedListing(null);
        }
      } catch (err) {
        toast.error('Could not fetch listings.');
      }
    };

    fetchListings();
  }, [categoryName]);

  return (
    <div className='category'>
      <header>
        <p className='pageHeader'>Places for {categoryName}</p>
      </header>
      {loading ? (
        <Spinner />
      ) : listings && listings.length > 0 ? (
        <>
          <main>
            <ul className='categoryListings'>
              {listings.map((listing) => (
                <ListingItem
                  key={listing.id}
                  id={listing.id}
                  listing={listing.data}
                />
              ))}
            </ul>
          </main>

          {lastFetchedListing && (
            <p className='loadMore' onClick={handleFetchMoreListings}>
              Load More
            </p>
          )}
        </>
      ) : (
        <p>No listings for {categoryName}</p>
      )}
    </div>
  );
}

export default Category;
