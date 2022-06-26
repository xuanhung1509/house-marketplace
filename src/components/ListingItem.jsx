import { Link } from 'react-router-dom';
import { ReactComponent as DeleteIcon } from '../assets/svg/deleteIcon.svg';
import { ReactComponent as EditIcon } from '../assets/svg/editIcon.svg';
import bedIcon from '../assets/svg/bedIcon.svg';
import bathtubIcon from '../assets/svg/bathtubIcon.svg';

function ListingItem({ listing, id, handleDelete, handleEdit }) {
  const {
    type,
    imgUrls,
    name,
    location,
    offer,
    discountedPrice,
    regularPrice,
    bedrooms,
    bathrooms,
  } = listing;

  const regexPattern = /\B(?=(\d{3})+(?!\d))/g;
  const formatPrice = (price) => {
    return price.toString().replace(regexPattern, ',');
  };

  return (
    <div className='categoryListing'>
      <Link to={`/category/${type}/${id}`} className='categoryListingLink'>
        <img src={imgUrls[0]} alt={name} className='categoryListingImg' />
        <div className='categoryListingDetails'>
          <p className='categoryListingLocation'>{location}</p>
          <p className='categoryListingName'>{name}</p>
          <p className='categoryListingPrice'>
            ${offer ? formatPrice(discountedPrice) : formatPrice(regularPrice)}
            {type === 'rent' && '/ Month'}
          </p>
          <div className='categoryListingInfoDiv'>
            <img src={bedIcon} alt='bed' />
            <p className='categoryListingInfoText'>
              {bedrooms > 1 ? `${bedrooms} Bedrooms` : '1 Bedroom'}
            </p>
            <img src={bathtubIcon} alt='bed' />
            <p className='categoryListingInfoText'>
              {bathrooms > 1 ? `${bathrooms} Bathrooms` : '1 Bathroom'}
            </p>
          </div>
        </div>
      </Link>

      {handleDelete && (
        <DeleteIcon
          className='removeIcon'
          fill='rgb(231, 76, 60'
          onClick={() => handleDelete(id, name)}
        />
      )}

      {handleEdit && (
        <EditIcon className='editIcon' onClick={() => handleEdit(id)} />
      )}
    </div>
  );
}

export default ListingItem;
