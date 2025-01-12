import ADD_JOURNAL_IMG from '../assets/images/add.svg';
import NO_SEARCH_RESULT from '../assets/images/search.svg';
import NO_SEARCH_BYDATE from '../assets/images/calendar.svg';

export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export const getInitials = (name)=> {
    if(!name) return "";

    const words = name.split(" ");
    let initials="";

    for(let i=0; i<Math.min(words.length,2);i++){
        initials += words[i][0];
    }
    return initials.toUpperCase();
};

export const getEmptyCardMessage = (filterType) => {
    switch(filterType) {
        case "search" :
            return `Oops! No Journals found matching your search.`;
        case "date":
            return `No Journals found in the given date range.`;
        default:
            return `Start creating your first Travel Journal! Click the "Add" button to capture your thoughts, ideas, and memories. Let's get started.`;
    }
};

export const getEmptyCardImg = (filterType) => {
    switch (filterType){
        case "search":
            return NO_SEARCH_RESULT;
        case "date":
            return NO_SEARCH_BYDATE;
        default:
            return ADD_JOURNAL_IMG;
    }
}