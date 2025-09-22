import z from "zod";

export const shortnerSchema= z.object({
    url:z  
        .string()
        .trim()
        .url({message:"please enter a valid URL."})
        .max(1024,{message:"URL cannot be this much longer"}),
        
    shortcode:z
        .string({required_error:"Shortcode is required."})
        .trim()
        .min(3,{message:"Shortcode must be atleast 3 char long."})
        .max(50,{message:"Shortcode too much long."}),               
})