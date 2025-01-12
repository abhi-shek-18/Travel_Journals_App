import React, { useState } from 'react'
import { MdAdd, MdClose, MdDeleteOutline, MdUpdate } from 'react-icons/md'
import DateSelector from '../../components/Input/DateSelector';
import ImageSelector from '../../components/Input/ImageSelector';
import TagInput from '../../components/Input/TagInput';
import moment from 'moment';
import axiosInstance from "../../utils/axiosInstance";
import uploadImage from "../../utils/uploadImage";
import { toast } from "react-toastify";

const AddEditTravelJournal = ({
    journalInfo,
    type,
    onClose,
    getAllTravelJournals,
}) => {

    const [title,setTitle] = useState(journalInfo?.title || "");
    const [journalImg,setJournalImg] = useState(journalInfo?.imageUrl ||null);
    const [journal,setJournal] = useState(journalInfo?.journal ||"");
    const [visitedLocation,setVisitedLocation] = useState(journalInfo?.visitedLocation||[]);
    const [visitedDate, setVisitedDate] = useState(journalInfo?.visitedDate ||null);

    const [error, setError] = useState("");

    //Add new Travel Journal 
    const addNewTravelJournal = async () => {
        try{
            let imageUrl= "";

            //upload image if present
            if(journalImg){
                const imgUploadRes=await uploadImage(journalImg);
                //Get image URL
                imageUrl= imgUploadRes.imageUrl || "";
            }

            const response = await axiosInstance.post("/add-travel-journal",{
                title,
                journal,
                imageUrl: imageUrl || "",
                visitedLocation,
                visitedDate:visitedDate? moment(visitedDate).valueOf(): moment().valueOf(),
            });

            if(response.data && response.data.journal) {
                toast.success("Journal Added Successfully");
                //Refresh Journal
                getAllTravelJournals();
                
                //close modal or form
                onClose();
            }
        }catch(error){
            if(
                error.response &&
                error.response.data &&
                error.response.data.message
            ){
                setError(error.response.data.message);
            }else{
                setError("An unexpected Error occurred. Please try again. ");
            }
        }
    };

    //update travel journal
    const updateTravelJournal = async () =>{

        const journalId = journalInfo._id;
        try{
            let imageUrl= "";

            let postData={
                title,
                journal,
                imageUrl: journalInfo.imageUrl || "",
                visitedLocation,
                visitedDate:visitedDate? moment(visitedDate).valueOf(): moment().valueOf(),
            };

            if(typeof journalImg === "object") {
                //Upload New Image
                const imgUploadRes = await uploadImage(journalImg);
                imageUrl = imgUploadRes?.imageUrl || "";

                postData = {
                    ...postData,
                    imageUrl: imageUrl,
                };
            }


            const response = await axiosInstance.put("/edit-journal/"+journalId, postData);

            if(response.data && response.data.journal) {
                toast.success("Journal Updated Successfully");
                //Refresh Journal
                getAllTravelJournals();
                
                //close modal or form
                onClose();
            }
        }catch(error){
          console.log(error);
            if(
                error.response &&
                error.response.data &&
                error.response.data.message
            ){
                setError(error.response.data.message);
            }else{
                setError("An unexpected Error occurred. Please try again. ");
            }
        }
    };

    const handleAddOrUpdateClick= () =>{
        console.log("Input Data:", {title, journalImg, journal, visitedLocation,visitedDate});

        if(!title){
            setError("Please enter the title");
            return;
        }
        
        if(!journal){
            setError("Please enter the journal details");
            return;
        }

        setError("");

        if(type === "edit") {
            updateTravelJournal();
        }else{
            addNewTravelJournal();
        }
    };

    // Delete journal image and update the story
    const handleDeleteJournalImg = async () => {
        // Delete story image and update the story
        const deleteImgRes = await axiosInstance.delete("/delete-image", {
            params: {
                imageUrl: journalInfo.imageUrl, 
            },
        });

        if(deleteImgRes.data){
            const journalId = journalInfo._id;

            const postData = {
                title,
                journal,
                visitedLocation,
                visitedDate: moment().valueOf(),
                imageUrl:"",
            };

            //Updating story
            const response = await axiosInstance.put("/edit-journal/"+journalId,postData);
            setJournalImg(null);
        }
    }
  
    return (
    <div className='relative'>
        <div className='flex items-center justify-between'>
            <h5 className='text-xl font-medium text-slate-700'>
                {type === "add" ? "Add Journal" : "Update Journal"}
            </h5>

            <div>
                <div className='flex items-center gap-3 bg-cyan-50/50 p--2 rounded-l-lg'>
                   {type=== 'add'? (<button className='btn-small' onClick={handleAddOrUpdateClick}>
                        <MdAdd className='text-lg' /> ADD JOURNAL
                    </button>) : (<>

                    <button className='btn-small' onClick={handleAddOrUpdateClick}>
                        <MdUpdate className='text-lg' />UPDATE STORY
                    </button>

                  
                    </>)}

                    <button className='' onClick={onClose}>
                        <MdClose className='text-lg text-slate-400' /> 
                    </button>                    
                </div>

                {error && (
                    <p className='text-red-500 text-xs pt-2 text-right'>{error}</p>
                )}
            </div>
        </div>

        <div>
            <div className='flex-1 flex flex-col gap-2 pt-4'>
                <label className='input-label'>TITLE</label>
                <input 
                    type="text"
                    className='text-2xl text-slate-950 outline-none'
                    placeholder='A Day at the Great Wall'
                    value={title}
                    onChange={({target}) => setTitle(target.value)} />

                    <div className="my-3">
                        <DateSelector date={visitedDate} setDate={setVisitedDate} />
                    </div>

                    <ImageSelector 
                        image={journalImg}
                        setImage={setJournalImg} handleDeleteImg={handleDeleteJournalImg} />

                    <div className='flex flex-col gap-2 mt-4'>
                        <label className='input-label'>JOURNAL</label>
                        <textarea type="text" className='text-sm text-slate-950 outline-none bg-slate-50 p-2 rounded' placeholder='Your Journal' rows={10} value={journal} onChange={({ target }) => setJournal(target.value)}></textarea>

                    </div>

                    <div className='pt-3'>
                        <label className="input-label">VISISTED LOCATION</label>
                        <TagInput tags={visitedLocation} setTags={setVisitedLocation} />
                    </div>
            </div>
        </div>
    </div>
  )
}

export default AddEditTravelJournal