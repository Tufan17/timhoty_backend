import BaseModel from "@/models/BaseModel";

class VisaPackageFeatureModel extends BaseModel {
    constructor() {
        super("visa_package_features");
    }
    static columns = [
        'id',
        'visa_package_id',
        'created_at',
        'updated_at',
        'deleted_at',
    ];
}

export default VisaPackageFeatureModel;
