const { response } = require('express');
const collections = require('../config/collections');
var db=require('../config/connection')
var objectId=require('mongodb').ObjectID
module.exports={
    addProduct:(product,callback)=>{
        
        db.get().collection('product').insert(product).then((data)=>{
            callback(data.ops[0]._id);
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(prodId)=>{
        console.log(prodId);
        console.log(objectId(prodId));
        return new Promise ((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).removeOne({_id:objectId(prodId)}).then((response)=>{
                console.log(response)
                resolve(response)
            })

        })
    },
    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)}).then((product)=>{
                console.log(product);
                resolve(product)
            })
        })
         
    },
    updateProduct:(prodId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id:objectId(prodId)},{
                $set:{
                    Brand:proDetails.Brand,
                    Model:proDetails.Model,
                    Price:proDetails.Price,
                    Storage:proDetails.Storage,
                }
            }).then((response)=>{
                resolve()
            })
            })
        
    }
}