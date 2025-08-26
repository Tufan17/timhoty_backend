import { FastifyRequest, FastifyReply } from "fastify";
import VisaPackageImageModel from "@/models/VisaPackageImageModel";
import VisaPackageModel from "@/models/VisaPackageModel";

export default class VisaPackageImageController {
  async findAll(req: FastifyRequest, res: FastifyReply) {
    try {
      const { visa_package_id } = req.query as { visa_package_id?: string };
      
      let images;
      if (visa_package_id) {
        images = await new VisaPackageImageModel().getByVisaPackageId(visa_package_id);
      } else {
        images = await new VisaPackageImageModel().getAll();
      }

      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE_IMAGE.IMAGES_FETCHED_SUCCESS"),
        data: images,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_PACKAGE_IMAGE.IMAGES_FETCHED_ERROR"),
      });
    }
  }

  async findOne(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const image = await new VisaPackageImageModel().findId(id);

      if (!image) {
        return res.status(404).send({
          success: false,
          message: req.t("VISA_PACKAGE_IMAGE.IMAGE_NOT_FOUND"),
        });
      }

      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE_IMAGE.IMAGE_FETCHED_SUCCESS"),
        data: image,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_PACKAGE_IMAGE.IMAGE_FETCHED_ERROR"),
      });
    }
  }

  async create(req: FastifyRequest, res: FastifyReply) {
    try {
      const { visa_package_id, images } = req.body as {
        visa_package_id: string;
        images: string | string[];
      };

      // Validate hotel_room_id
      const existingVisaPackage = await new VisaPackageModel().exists({
        id: visa_package_id,
      });

      if (!existingVisaPackage) {
        return res.status(400).send({
          success: false,
          message: req.t("VISA_PACKAGE.NOT_FOUND"),
        });
      }

      // Normalize images to array
      const imageUrls = Array.isArray(images) ? images : [images];
      const createdImages = [];

      // Create hotel room images
      for (const imageUrl of imageUrls) {
        const image = await new VisaPackageImageModel().create({
          visa_package_id,
          image_url: imageUrl,
        });
        createdImages.push(image);
      }

      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE_IMAGE.IMAGE_CREATED_SUCCESS"),
        data: createdImages,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_PACKAGE_IMAGE.IMAGE_CREATED_ERROR"),
      });
    }
  }
  async update(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { image_url } = req.body as { image_url: string };

      const existingImage = await new VisaPackageImageModel().findId(id);
      if (!existingImage) {
        return res.status(404).send({
          success: false,
          message: req.t("VISA_PACKAGE_IMAGE.IMAGE_NOT_FOUND"),
        });
      }

      const updatedImage = await new VisaPackageImageModel().update(id, {
        image_url,
      });

      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE_IMAGE.IMAGE_UPDATED_SUCCESS"),
        data: updatedImage,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_PACKAGE_IMAGE.IMAGE_UPDATED_ERROR"),
      });
    }
  }

  async delete(req: FastifyRequest, res: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const existingImage = await new VisaPackageImageModel().findId(id);

      if (!existingImage) {
        return res.status(404).send({
          success: false,
          message: req.t("VISA_PACKAGE_IMAGE.IMAGE_NOT_FOUND"),
        });
      }

      await new VisaPackageImageModel().delete(id);

      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE_IMAGE.IMAGE_DELETED_SUCCESS"),
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_PACKAGE_IMAGE.IMAGE_DELETED_ERROR"),
      });
    }
  }

  async deleteByVisaPackageId(req: FastifyRequest, res: FastifyReply) {
    try {
      const { visa_package_id } = req.params as { visa_package_id: string };

      // Validate visa package exists
      const existingVisaPackage = await new VisaPackageModel().findId(visa_package_id);
      if (!existingVisaPackage) {
        return res.status(400).send({
          success: false,
          message: req.t("VISA_PACKAGE.VISA_PACKAGE_NOT_FOUND"),
        });
      }

      const deletedCount = await new VisaPackageImageModel().deleteByVisaPackageId(visa_package_id);

      return res.status(200).send({
        success: true,
        message: req.t("VISA_PACKAGE_IMAGE.IMAGES_DELETED_SUCCESS"),
        data: { deleted_count: deletedCount },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: req.t("VISA_PACKAGE_IMAGE.IMAGES_DELETED_ERROR"),
      });
    }
  }
}
