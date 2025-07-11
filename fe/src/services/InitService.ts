import { apiClient } from '../utils/RequestUtils';

interface InitResponse {
  ok: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}

export class InitService {
  /**
   * 初始化 RBAC demo 資料
   * POST /api/init/rbac-demo
   */
  static async initRbacDemo(): Promise<InitResponse> {
    try {
      const response = await apiClient.post<InitResponse>('/api/init/rbac-demo');
      return response;
    } catch (error: any) {
      console.error('Failed to initialize RBAC demo:', error);
      throw new Error(error.response?.data?.message || 'Failed to initialize RBAC demo');
    }
  }

  /**
   * � RTK demo Ǚ
   * POST /api/init/rtk-demo
   */
  static async initRtkDemo(): Promise<InitResponse> {
    try {
      const response = await apiClient.post<InitResponse>('/api/init/rtk-demo');
      return response;
    } catch (error: any) {
      console.error('Failed to initialize RTK demo:', error);
      throw new Error(error.response?.data?.message || 'Failed to initialize RTK demo');
    }
  }

  /**
   *  !'�@	 demo Ǚ
   */
  static async initAllDemo(): Promise<{
    rbac: InitResponse;
    rtk: InitResponse;
  }> {
    try {
      const [rbacResult, rtkResult] = await Promise.all([
        this.initRbacDemo(),
        this.initRtkDemo()
      ]);

      return {
        rbac: rbacResult,
        rtk: rtkResult
      };
    } catch (error: any) {
      console.error('Failed to initialize all demo data:', error);
      throw new Error('Failed to initialize demo data');
    }
  }
}