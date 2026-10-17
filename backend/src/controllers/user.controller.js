import httpsStatus from 'http-status'
import { User } from '../models/user.model.js';
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { randomBytes } from 'node:crypto'
const register=async(req,res)=>{
  const {name,username,password}=req.body;

  try{
    const existingUser=await User.findOne({username})
    if(existingUser){
      return res.status(409).json({message:'User already exist'})
    }
    const hashedPassword=await bcrypt.hash(password,10)
    const newUser=new User({
      name:name,
      username:username,
      password:hashedPassword
    })
    await newUser.save();
    res.status(httpsStatus.CREATED).json({message:'User Registered'})
  }
  catch(e){
     res.json({message:`Something went wrong ${e}`})
  }
}


const login=async(req,res)=>{
  const {username,password}=req.body;
  if(!username||!password){
    return res.status(400).json({message:"please provide"})
  }
  try{
    const user=await User.findOne({username});
   if(!user){
    return res.status(httpsStatus.NOT_FOUND).json({message:"User not Found"})
   }
   if(bcrypt.compare(password,user.password)){
    let token =crypto.randomBytes(20).toString('hex')
    user.token=token;
    await user.save();
    return res.status(httpsStatus.OK).json({token:token})
   }

  }catch(e){
    return res.status(500).json({message:`something went wrong ${e}`})
  }

}

export { login,register }