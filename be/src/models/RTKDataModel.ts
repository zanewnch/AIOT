import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    PrimaryKey,
} from 'sequelize-typescript';

import type { Optional } from 'sequelize';

type RTKDataAttributes = {
    id: number;
    latitude: number;
    longitude: number;
};

type RTKDataCreationAttributes = Optional<RTKDataAttributes, 'id'>;

@Table({ tableName: 'rtk_data', timestamps: true })
export class RTKDataModel extends Model<RTKDataAttributes, RTKDataCreationAttributes> implements RTKDataAttributes {
    @PrimaryKey
    @Column(DataType.BIGINT)
    declare id: number;

    @Column(DataType.FLOAT)
    declare latitude: number;

    @Column(DataType.FLOAT)
    declare longitude: number;



}