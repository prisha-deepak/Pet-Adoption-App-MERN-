const createHttpError = require('http-errors')
const ProductModel = require('../model/pets')
const mongoose = require('mongoose');
const path = require('path');

exports.create = async (req, res, next) => {
    const {
        petname,
        pettype,
        petbreed,
        petage,
        description,
        location
    } = req.body;

    try {
        // Defensive check: ensure image is uploaded
        if (!req.files || !req.files.image) {
            throw createHttpError(400, "Image is required and must be sent as form-data");
        }

        const { image } = req.files;

        if (!image.mimetype.startsWith('image')) {
            throw createHttpError(400, 'Only image files are allowed');
        }

        // Save image to public folder
        const uploadPath = path.join(__dirname, '..', '..', 'public', 'pets', image.name);
        await image.mv(uploadPath);

        const filepathtoUpload = `/public/pets/${image.name}`;

        // Validate required fields
        if (!petname || !pettype || !petbreed || !petage || !location) {
            throw createHttpError(400, 'Please provide all the required fields');
        }

        const pet = new ProductModel({
            petname,
            pettype,
            petbreed,
            petage,
            image: filepathtoUpload,
            description,
            location,
            status: 'available'
        });

        const result = await pet.save();
        res.status(201).send(result);

    } catch (error) {
        next(error)
    }
}

exports.update = async (req, res, next) => {
    const petid = req.params.id;

    const {
        petname,
        pettype,
        petbreed,
        petage,
        description,
        location
    } = req.body;

    try {
        if (!petid) {
            throw createHttpError(400, 'Please provide pet ID');
        }

        if (!mongoose.isValidObjectId(petid)) {
            throw createHttpError(400, 'Invalid pet ID');
        }

        let pth;
        if (req.files && req.files.image) {
            const image = req.files.image;

            if (!image.mimetype.startsWith('image')) {
                throw createHttpError(400, 'Only image files are allowed');
            }

            const uploadPath = path.join(__dirname, '..', '..', 'public', 'pets', image.name);
            await image.mv(uploadPath);

            pth = `/public/pets/${image.name}`;
        }

        const pet = await ProductModel.findById(petid).exec();
        if (!pet) {
            throw createHttpError(404, 'Pet not found');
        }

        // Update only provided fields
        pet.petname = petname || pet.petname;
        pet.pettype = pettype || pet.pettype;
        pet.petbreed = petbreed || pet.petbreed;
        pet.petage = petage || pet.petage;
        pet.image = pth || pet.image;
        pet.description = description || pet.description;
        pet.location = location || pet.location;

        const result = await pet.save();
        res.status(200).send(result);

    } catch (error) {
        next(error)
    }
}

exports.getAll = async (req, res, next) => {
    try {
        const result = await ProductModel.find().exec();
        res.status(200).send(result);
    } catch (error) {
        next(error)
    }
}

exports.getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await ProductModel.findById(id).exec();
        res.status(200).send(result);
    } catch (error) {
        next(error)
    }
}

exports.delete = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await ProductModel.findByIdAndDelete(id).exec();
        res.status(200).send(result);
    } catch (error) {
        next(error)
    }
}

exports.search = async (req, res, next) => {
    try {
        const search = req.params.search;

        const result = await ProductModel.find({
            $or: [
                { petname: { $regex: search, $options: 'i' } },
                { pettype: { $regex: search, $options: 'i' } },
                { petbreed: { $regex: search, $options: 'i' } }
            ]
        }).exec();

        res.status(200).send(result);
    } catch (error) {
        next(error)
    }
}
