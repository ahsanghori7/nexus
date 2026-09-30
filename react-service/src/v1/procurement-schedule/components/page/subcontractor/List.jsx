import React, { useState, useEffect } from 'react';
import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';
import SliderCarousel from '../../../../global/components/SliderCarousel';
import Slides from './Slides';
import Header from './Header';
import NoSlides from './NoSlides';

const viewPorts = {
  mobile: 767,
  tablet: 991,
  desktop: 1399,
};

function checkViewport() {
  let slides;
  switch (true) {
    case window.innerWidth <= viewPorts.mobile:
      slides = 1;
      break;
    case window.innerWidth <= viewPorts.tablet:
      slides = 2;
      break;
    case window.innerWidth <= viewPorts.desktop:
      slides = 3;
      break;
    default:
      slides = 4;
      break;
  }
  return slides;
}

function List({ interests, pid, callback, slug }) {
  const [slidesShown, setSlidesShown] = useState(checkViewport());
  useEffect(() => {
    let mounted = true;
    function handleResize() {
      if (mounted) {
        setSlidesShown(checkViewport());
      }
    }

    window.addEventListener('resize', debounce(handleResize, 100));

    return () => {
      window.removeEventListener('resize', debounce(handleResize, 100));
      mounted = false;
    };
  }, []);

  return (
    <>
      {isEmpty(interests) && <NoSlides />}
      {!isEmpty(interests) && (
        <>
          <Header interests={interests} pid={pid} callback={callback} />
          <SliderCarousel
            className="w-100 p-1 pl-2 pb-2 subcontractor-slider"
            goBack={<FontAwesomeIcon icon={faChevronLeft} />}
            goNext={<FontAwesomeIcon icon={faChevronRight} />}
            slideHeight={10}
            slideWidth={243}
            totalSlides={interests.length}
            visibleSlides={slidesShown}
          >
            <Slides
              interests={interests}
              pid={pid}
              callback={callback}
              slug={slug}
            />
          </SliderCarousel>
        </>
      )}
    </>
  );
}

export default List;
