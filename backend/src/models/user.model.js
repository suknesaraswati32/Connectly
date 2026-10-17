import { Schema } from "mongoose";
const userSchema=new Schema(
  {
    name:{
      type:String,
      required:true
    },
    username:{
      type:String,
      required:true,
      unique:true
    },
    password:{
      type:Stringc,
      required:true
    },
    token:{
      type:String
    }

})

const User=mongoose.model('User',userSchema)

export { User }