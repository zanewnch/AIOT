import React, { useEffect, useState } from 'react';
import styles from '../styles/TableViewer.module.scss';
import { RequestUtils } from 'utils/RequestUtils';
import { RTKData } from 'types/IRTKData';


interface TableViewerProps {
  className?: string;
}


const requestUtils = new RequestUtils();
const getRTKData = async () => {
  try{
    const data = await requestUtils.get('/rtk');
    console.log(data);
    return data;
  }catch(error){
    console.error('Error fetching RTK data:', error);
  }
}



const dummyRTKData: RTKData[] = [
  { id: 1, longitude: 121.5654, latitude: 25.0330, altitude: 45.2, timestamp: '2024-01-15 10:30:15' },
  { id: 2, longitude: 121.5204, latitude: 25.0478, altitude: 38.7, timestamp: '2024-01-15 10:31:22' },
  { id: 3, longitude: 121.5436, latitude: 25.0176, altitude: 52.1, timestamp: '2024-01-15 10:32:45' },
  { id: 4, longitude: 121.5581, latitude: 25.0408, altitude: 41.8, timestamp: '2024-01-15 10:33:18' },
  { id: 5, longitude: 121.5123, latitude: 25.0267, altitude: 36.4, timestamp: '2024-01-15 10:34:56' },
  { id: 6, longitude: 121.5789, latitude: 25.0512, altitude: 48.9, timestamp: '2024-01-15 10:35:33' },
  { id: 7, longitude: 121.5345, latitude: 25.0389, altitude: 44.6, timestamp: '2024-01-15 10:36:41' },
  { id: 8, longitude: 121.5667, latitude: 25.0445, altitude: 39.3, timestamp: '2024-01-15 10:37:28' },
];

export const TableViewer: React.FC<TableViewerProps> = ({ className }) => {


  const [rtkData, setRtkData] = useState<RTKData[]>([]);


  useEffect(() => {
    getRTKData().then((data) => {
      setRtkData(data);
    });
  }, []);

  return (
    <div className={`${styles.tableViewerRoot} ${className || ''}`}>
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2>RTK Table</h2>
          <span className={styles.recordCount}>{dummyRTKData.length} records</span>
        </div>

        <div className={styles.tableWrapper}>
          <table
            className={styles.table}
            style={{ '--row-count': dummyRTKData.length } as React.CSSProperties}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>經度 (Longitude)</th>
                <th>緯度 (Latitude)</th>
                <th>海拔 (Altitude)</th>
                <th>時間戳記 (Timestamp)</th>
              </tr>
            </thead>
            <tbody>
              {dummyRTKData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.longitude.toFixed(4)}</td>
                  <td>{item.latitude.toFixed(4)}</td>
                  <td>{item.altitude.toFixed(1)}m</td>
                  <td>{item.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 