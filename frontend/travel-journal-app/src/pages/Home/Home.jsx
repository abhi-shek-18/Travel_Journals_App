import React, { useEffect, useState } from 'react';
import { MdAdd } from "react-icons/md"; 
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import Modal from "react-modal";
import TravelJournalCard from '../../components/Cards/TravelJournalCard';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddEditTravelJournal from './AddEditTravelJournal';
import ViewTravelJournal from './ViewTravelJournal';
import EmptyCard from '../../components/Cards/EmptyCard';
import EmptyImg from "../../assets/images/add.svg"
import { DayPicker } from 'react-day-picker';
import moment from 'moment';
import FilterInfoTitle from '../../components/Cards/FilterInfoTitle';
import { getEmptyCardImg, getEmptyCardMessage } from '../../utils/helper';

const Home = () => {

  const navigate= useNavigate();
  const [userInfo,setUserInfo] = useState(null);
  const [allJournals,setAllJournals] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState('');

  const [dateRange, setDateRange] = useState({from: null, to:null});

  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
  });

  const [openViewModal, setOpenViewModal] = useState({
    isShown:false,

    data:null,
  });

  //get user info
  const getUserInfo = async () => {
    try{
      const response = await axiosInstance.get("/get-user");
      if(response.data && response.data.user){
        //set user info if data exists
        setUserInfo(response.data.user);
      }
    }catch(error){
      if(error.response.status === 401){
        //clear storage if unauthorised 
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  //Get all travel journals
  const getAllTravelJournals = async () => {
    try {
      const response = await axiosInstance.get("/get-all-journals");
      if(response.data && response.data.journals){
        setAllJournals(response.data.journals);
      }
    }catch(error){
      console.log("An unexpected error occurred. Please try again.");
    }
  }

  //handle Edit Journal Click
  const handleEdit = (data) => {
    setOpenAddEditModal({isShown:true, type:"edit", data: data});
  }

  //Handle Travel Journal Click 
  const handleViewJournal = (data) => {
    setOpenViewModal({isShown:true, data});
  }

  //Handle update Favourite
  const updateIsFavourite = async (journalData) => {
    const journalId = journalData._id;

    try{
      const response= await axiosInstance.put(
        "/update-is-favourite/"+ journalId,
        {
          isFavourite: !journalData.isFavourite,
        }
      );

      if(response.data && response.data.journal){
        toast.success("Story Updated Successfully.");

        if(filterType === "search" && searchQuery){
          onSearchJournal(searchQuery);
        }else if(filterType === "date"){
          filterJournalsByDate(dateRange);
        }else{
        getAllTravelJournals();
        }
      }
    }catch(error){
      console.log("An unexpected error occurred. Please try again.");
    }
  }

  //Delete Journal
  const deleteTravelJournal = async (data) => {
    const journalId= data._id;

    try{
      const response = await axiosInstance.delete("/delete-journal/" + journalId);
      if(response.data && !response.data.error){
        toast.error("Journal Deleted Successfully");
        setOpenViewModal((prevState) => ({ ...prevState, isShown:false }));
        getAllTravelJournals();
      }
    }catch(error){
      console.log("An unexpected error occurred. Please try again.");
    }
  };

  const onSearchJournal = async (query) =>{
    try{
      const response = await axiosInstance.get("/search", {
        params: {
          query,
        },
      });
      if(response.data && response.data.journals){
        setFilterType("search");
        setAllJournals(response.data.journals);
      }
    }catch(error) {
      console.log('An Unexpected error occurred. please')
    }
  }

  const handleClearSearch = ()=>{
    setFilterType("");
    getAllTravelJournals();
  }

  const filterJournalsByDate = async (day) => {
    try{
      const startDate=day.from ? moment(day.from).valueOf():null;
      const endDate = day.to? moment(day.to).valueOf():null;

      if(startDate && endDate){
        const response = await axiosInstance.get("/travel-journals/filter", {
          params: {startDate, endDate },
        });

        if(response.data && response.data.journals){
          setFilterType("date");
          setAllJournals(response.data.journals);
        }
      }
    }catch(error){
      console.log(error);
      console.log("An unexpected error occurred. Please try again.");
    }
  }

const resetFilter = () => {
setDateRange({from:null, to:null });
setFilterType("");
getAllTravelJournals();
}

  const handleDayClick = (day) => {
    setDateRange(day);
    filterJournalsByDate(day);
  }

  useEffect( () =>{
    getAllTravelJournals();
    getUserInfo();

    return () => {};
  }, []);


  return (
    <>
    <Navbar userInfo={userInfo} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
    onSearchJournal={onSearchJournal}
    handleClearSearch={handleClearSearch} />
   
    <div className='container mx-auto py-10'>

    <FilterInfoTitle
      filterType={filterType}
      filterDates={dateRange}
      onClear = {()=> {
        resetFilter();
      }}
      />

      <div className='flex gap-7'>
        <div className='flex-1'>
          {allJournals.length > 0 ? (
            <div className='grid grid-cols-2 gap-4'>
              {allJournals.map((item) =>{
                return (
                  <TravelJournalCard 
                  key={item._id}
                  imgUrl= { item.imageUrl }
                  title= {item.title}
                  journal= {item.journal}
                  date= {item.visitedDate}
                  visitedLocation= {item.visitedLocation}
                  isFavourite= {item.isFavourite}
                  onClick={() => handleViewJournal(item)}
                  onFavouriteClick={() => updateIsFavourite(item)}
                       />
                );
              })}
              </div>
          ) : (
            <EmptyCard imgSrc={getEmptyCardImg(filterType)}
            message={getEmptyCardMessage(filterType)} />
          )}
        </div>
        <div className='w-[350px]'>
          <div className='bg-white border border-slate-200 shadow-lg shadow-slate-200/60 rounded-lg'>
          <div className='p-3'>
            <DayPicker
              captionLayout='dropdown-buttons'
              mode="range"
              selected={dateRange}
              onSelect={handleDayClick}
              pagedNavigation
              />
          </div>
          </div>
        </div>
      </div>
    </div>

          {/* Add & Edit Travel Journal Modal */}
          <Modal 
            isOpen={openAddEditModal.isShown}
            onRequestClose={() => {}}
            style={{
              overlay: {
                backgroundColor: "rgba(0,0,0,0.2)",
                zIndex: 999,
              },
            }}
            appElement={document.getElementById("root")}
            className="model-box"
            >
              <AddEditTravelJournal
                type={openAddEditModal.type}
                journalInfo={openAddEditModal.data}
                onClose={() => {
                  setOpenAddEditModal({ isShown: false, type: "add", data: null});
                }}
                getAllTravelJournals={getAllTravelJournals}
              />
            </Modal>

            {/* view Modal for Travel Journal  */}
            <Modal 
            isOpen={openViewModal.isShown}
            onRequestClose={() => {}}
            style={{
              overlay: {
                backgroundColor: "rgba(0,0,0,0.2)",
                zIndex: 999,
              },
            }}
            appElement={document.getElementById("root")}
            className="model-box"
            >
              
              <ViewTravelJournal
                journalInfo={openViewModal.data || null}
                onClose = {()=>{
                  setOpenViewModal((prevState) => ({...prevState, isShown:false }));
                }} 
                onEditClick = {()=>{
                  setOpenViewModal((prevState) => ({...prevState, isShown:false }));
                  handleEdit(openViewModal.data || null);
                }}
                onDeleteClick = {()=>{
                  deleteTravelJournal(openViewModal.data ||null);
                }}
                />
            </Modal>

    <button className='w-16 h-16 flex items-center justify-center rounded-full bg-primary hover:bg-cyan-400 fixed right-10 bottom-10' onClick={() => {
      setOpenAddEditModal( { isShown: true, type: "add", data: null});
    }}
    >
      <MdAdd className="text-[32px] text-white" />
    </button>

    <ToastContainer />
    </>
  )
}

export default Home