import { useState, useEffect } from 'react';
import * as OpenCascadeModule from 'opencascade.js';
import shapeToUrl from '../lib/shapeToUrl';

interface UseOpenCascadeReturn {
  modelUrl: string | undefined;
  isLoading: boolean;
  error: string | null;
  oc: any;
}

export function useOpenCascade(): UseOpenCascadeReturn {
  const [modelUrl, setModelUrl] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oc, setOc] = useState<any>(null);

  useEffect(() => {
    OpenCascadeModule.initOpenCascade()
      .then((ocInstance: any) => {
        setOc(ocInstance);
        
        try {
          // 既存の形状生成ロジック（元 model-viewer 実装からの移植）
          const sphere = new ocInstance.BRepPrimAPI_MakeSphere_1(1);
          
          // Take shape and subtract a translated and scaled sphere from it
          const makeCut = (shape: any, translation: number[], scale: number) => {
            const tf = new ocInstance.gp_Trsf_1();
            tf.SetTranslation_1(new ocInstance.gp_Vec_4(translation[0], translation[1], translation[2]));
            tf.SetScaleFactor(scale);
            const loc = new ocInstance.TopLoc_Location_2(tf);

            const cut = new ocInstance.BRepAlgoAPI_Cut_3(
              shape, 
              sphere.Shape().Moved(loc, false), 
              new ocInstance.Message_ProgressRange_1()
            );
            cut.Build(new ocInstance.Message_ProgressRange_1());

            return cut.Shape();
          };

          // Rotate around the Z axis
          const makeRotation = (rotation: number) => {
            const tf = new ocInstance.gp_Trsf_1();
            tf.SetRotation_1(
              new ocInstance.gp_Ax1_2(
                new ocInstance.gp_Pnt_1(), 
                new ocInstance.gp_Dir_4(0, 0, 1)
              ), 
              rotation
            );
            const loc = new ocInstance.TopLoc_Location_2(tf);
            return loc;
          };

          // Let's make some cuts
          const cut1 = makeCut(sphere.Shape(), [0, 0, 0.7], 1);
          const cut2 = makeCut(cut1, [0, 1, -0.7], 1);
          const cut3 = makeCut(cut2, [0, 0.25, 1.75], 1.825);
          const cut4 = makeCut(cut3, [4.8, 0, 0], 5);

          // Combine the result
          const fuse = new ocInstance.BRepAlgoAPI_Fuse_3(
            cut4, 
            cut4.Moved(makeRotation(Math.PI), false), 
            new ocInstance.Message_ProgressRange_1()
          );
          fuse.Build(new ocInstance.Message_ProgressRange_1());
          const result = fuse.Shape().Moved(makeRotation(-30 * Math.PI / 180), false);

          setModelUrl(shapeToUrl(ocInstance, result));
          setIsLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        setError(err instanceof Error ? err.message : 'Failed to initialize OpenCascade');
        setIsLoading(false);
      });
  }, []);

  return { modelUrl, isLoading, error, oc };
} 