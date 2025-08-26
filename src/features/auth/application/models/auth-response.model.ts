// export class UserPayloadModel {
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   fullName: string;
//   role: string;
//   department?: string;
//   isActive: boolean;
//   lastLoginAt?: Date;
//   createdAt: Date;
//   updatedAt: Date;

//   constructor(data: {
//     id: string;
//     email: string;
//     firstName: string;
//     lastName: string;
//     fullName: string;
//     role: string;
//     department?: string;
//     isActive: boolean;
//     lastLoginAt?: Date;
//     createdAt: Date;
//     updatedAt: Date;
//   }) {
//     Object.assign(this, data);
//   }
// }

// export class AuthResponseModel {
//   accessToken: string;
//   refreshToken: string;
//   tokenType: string;
//   expiresIn: number;
//   user: UserPayloadModel;

//   constructor(data: {
//     accessToken: string;
//     refreshToken: string;
//     tokenType: string;
//     expiresIn: number;
//     user: UserPayloadModel;
//   }) {
//     Object.assign(this, data);
//   }
// }