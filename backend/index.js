require("dotenv").config();


const config= require("./config.json");
const mongoose= require("mongoose");

const bcrypt=require("bcrypt");
const express=require("express");
const cors=require("cors");
const jwt= require("jsonwebtoken");
const upload = require("./multer");
const fs= require("fs");
const path= require("path");

const { authenticateToken }= require("./utilities");

const User=require("./models/user.model");
const TravelJournal=require("./models/travelJournal.model");


mongoose.connect(config.connectionString);



const app=express();
app.use(express.json());
app.use(cors({origin: "*"}));

// Create Account
app.post("/create-account", async(req,res)=>{
    const {fullName,email,password}=req.body;

    if(!fullName || !email || !password){
        return res.status(400).json({error:true,message:"All fields are required"});
    }

    const isUser = await User.findOne({email});
    if(isUser){
        return res.status(400).json({error:true, message: "User already exists!"});
    }

    const hashedPassword= await bcrypt.hash(password,10);

    const user= new User({
        fullName,
        email,
        password: hashedPassword,
    });
    await user.save();

    const accessToken=jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "72h",
        }
    );

    return res.status(201).json({
        error:false,
        user: { fullName: user.fullName, email: user.email },
        accessToken,
        message: "Registration Successfull",
    });
});

// Login API
app.post("/login", async(req,res)=>{
    const { email, password }= req.body;

    if(!email || !password){
        return res.status(400).json({ message: "Email and Password are required"});
    }

    const user= await User.findOne({ email });
    if(!user){
        return res.status(400).json({message: "User Not found"});
    }


    const isPasswordValid = await bcrypt.compare(password,user.password);
    if(!isPasswordValid){
        return res.status(400).json({ message: "Password is Invalid" });
    }

    const accessToken = jwt.sign(
        {
            userId: user._id
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "72h",
        }
    );

    return res.json({
        error: false,
        message: "Login successfull",
        user: { fullName: user.fullName, email: user.email },
        accessToken,
    });
});

//Get User
app.get("/get-user", authenticateToken, async(req,res)=>{
const { userId}= req.user

const isUser = await User.findOne({ _id: userId});

if(!isUser){
    return res.sendStatus(401);
}

return res.json({
    user: isUser,
    message: "",
});
});

//Add Travel Story
app.post("/add-travel-journal",authenticateToken, async(req,res)=>{
    const { title, journal, visitedLocation, imageUrl, visitedDate } = req.body;

    const { userId } = req.user;

    //validate required fields
    if(!title || !journal || !visitedLocation || !imageUrl || !visitedDate) {
        return res.status(400).json({error: true, message: "All fields are required"});
    }

    // Convert VisitedDate from milliseconds to Date Object
    const parsedVisitedDate = new Date(parseInt(visitedDate));

    try{
        const travelJournal=new TravelJournal({
            title,
            journal,
            visitedLocation,
            userId,
            imageUrl,
            visitedDate: parsedVisitedDate,
        });

        await travelJournal.save();
        res.status(200).json({journal: travelJournal, message: "Journal added Successfully"});
    }catch (error){
        res.status(400).json({ error: true, message: error.message});
    }
});

// Get All travel Stories
app.get("/get-all-journals", authenticateToken, async(req,res)=>{
    const { userId } = req.user;

    try{
        const travelJournals= await TravelJournal.find({ userId: userId}).sort({
            isFavourite: -1,
        });
        res.status(200).json({ journals: travelJournals });
    }catch(error){
        res.status(500).json({ error: true, message: error.message });
    }
});

//Edit Travel stories
app.put("/edit-journal/:id", authenticateToken, async(req,res)=>{
    const { id } = req.params;
    const { title, journal, visitedLocation, imageUrl, visitedDate} = req.body;
    const { userId }= req.user;

     //validate required fields
     if(!title || !journal || !visitedLocation || !visitedDate) {
        return res.status(400).json({error: true, message: "All fields are required"});
    }

    // Convert VisitedDate from milliseconds to Date Object
    const parsedVisitedDate = new Date(parseInt(visitedDate));


    try
    {
        //find the travel journal by ID and ensure it belongs to the authenticated user
        const travelJournal= await TravelJournal.findOne({ _id: id, userId: userId });

        if(!travelJournal){
            return res.status(404).json({error: true, message: "Travel journal not found"});
        }

        const placeholderImgUrl=`http:://localhost:8000/assets/placeholderImg.png`;

        travelJournal.title=title;
        travelJournal.journal=journal;
        travelJournal.visitedLocation = visitedLocation;
        travelJournal.imageUrl= imageUrl || placeholderImgUrl;
        travelJournal.visitedDate=parsedVisitedDate;

        await travelJournal.save();
        res.status(200).json({ journal: travelJournal, message:"Updated Journal successfully"});
    }catch(error){
        res.status(500).json({error: true, message: error.message });
    }
});

//Delete a travel journal 
app.delete("/delete-journal/:id",authenticateToken, async(req,res) => {
    const { id }= req.params;
    const { userId }= req.user;

    try{
        const travelJournal= await TravelJournal.findOne({ _id: id, userId: userId });

        if(!travelJournal){
            return res.status(404).json({error: true, message: "Travel journal not found"});
        }

        //Delete the travel journal from db
        await travelJournal.deleteOne({ _id: id, userId: userId});

        //extract the filename from the imageUrl
        const imageUrl = travelJournal.imageUrl;
        const filename = path.basename(imageUrl);

        //define the file path
         const filePath = path.join(__dirname,'uploads', filename);

         //Delete the image file from the uploads folder
         fs.unlink(filePath, (err) => {
            if(err){
                console.error("Failed to delete Image file: ",err);
                //Optionally, you could still respond with a success status here
                // if you don't want to treat this as a critical error.
            }
         });
         res.status(200).json({ message: "Travel Journal deleted successfully" });
    }catch(error){
        res.status(500).json({error:true, message: error.message });
    }
})

// Route to handle image upload
app.post("/image-upload", upload.single("image"), async(req,res)=>{
try{
    if(!req.file){
        return res.status(400).json({error: true, message: "No image uploaded"});
    }

    const imageUrl= `http://localhost:8000/uploads/${req.file.filename}`;

    res.status(200).json({ imageUrl });
}catch(error){
    res.status(500).json({ error: true, message: error.message });
}
});

//Delete and image from uploads folder
app.delete("/delete-image", async(req,res) => 
{
    const { imageUrl } = req.query;

    if(!imageUrl){
        return res.status(400).json({error: true, message: "imageUrl parameter is required"});
    }

    try{
        //Extract file name from the imageUrl
        const filename=path.basename(imageUrl);

        //Define the file path
        const filePath= path.join(__dirname, 'uploads', filename);

        //check if the file exists
        if(fs.existsSync(filePath)){
            //Delete the file from the uploads folder
            fs.unlinkSync(filePath);
            res.status(200).json({message: "Image deleted successfully"});
        }else{
            res.status(200).json({error: true, message: "Image not found"});
        }
    }catch(error){
        res.status(500).json({error:true, message: error.message});
    }
});

// update isFavourite
app.put("/update-is-favourite/:id",authenticateToken, async(req, res)=>{
    const { id } = req.params;
    const { isFavourite } = req.body;
    const { userId } = req.user;

    try{
        const travelJournal=await TravelJournal.findOne({ _id: id, userId: userId});
        
        if(!travelJournal){
            return res.status(404).json({ error: true, message: "Travel journal not found"});
        }
        travelJournal.isFavourite=isFavourite;
        await travelJournal.save();
        res.status(200).json({journal: travelJournal, message: "Updated successfully"});
    }catch(error){
         res.status(500).json({error: true, message: error.message });
    }
});

// search travel journals
app.get("/search", authenticateToken, async(req, res)=> {
    const { query } = req.query;
    const { userId } = req.user;

    if(!query){
        return res.status(404).json({error: true, message: "Query is required"});
    }

    try
    {
        const searchResults = await TravelJournal.find({ userId: userId,
            $or: [
                { title: { $regex: query, $options: "i" }},
                { journal: { $regex: query, $options: "i" }},
                { visitedLocation: { $regex: query, $options: "i" }},
            ],
         }).sort({ isFavourite: -1 });

         res.status(200).json({journals: searchResults});
    }catch(error){
        res.status(500).json({error: true, message: error.message });
    }
})

// filter travel journals by date range
app.get("/travel-journals/filter", authenticateToken, async(req,res) =>{
    const { startDate, endDate } = req.query;
    const { userId } = req.user;

    try{
        //convert startDate and endDate from milliseconds to Date Object
        const start= new Date(parseInt(startDate));
        const end = new Date(parseInt(endDate));

        //find travel journal that belong to the authenticated user and fall withing the date range
        const filteredJournals= await TravelJournal.find({
            userId: userId,
            visitedDate: { $gte: start, $lte: end },
        }).sort({ isFavourite: -1 });

        res.status(200).json({ journals: filteredJournals});

    }catch(error){
        res.status(500).json({error: true, message: error.message});
    }
})

// Serve static files from the uploads and assets directory
app.use("/uploads", express.static(path.join(__dirname,"uploads")));
app.use("/assets", express.static(path.join(__dirname,"assets")));


app.listen(8000);
module.exports=app;