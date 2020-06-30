
/// <reference path="../components/index.ts"/>
/// <reference path="../utils/index.ts"/>

namespace mark {

  const {
    openImage,
    saveImageFile,
    saveMarkupFile,
    createExportCord,
  } = utils;

  const {
    Files,
    Editor,
    DragAndDrop,
  } = components;

  const {
    Drawer,
    Typography,
  } = material.core;

  const {
    Fragment
  } = React;

  const {
    makeStyles
  } = material.styles;

  const {
    useState,
    useEffect,
    useCallback,
  } = React;

  const {
    max,
    min,
  } = Math;

  export namespace pages {

    const useStyles = makeStyles((theme) => ({
      drawer: {
        minWidth: 240,
      },
      adjust: {
        marginLeft: 240
      },
      openFile: {
        padding: 25,
      }
    }));

    export const useForceUpdate = () => {
      const [, setTick] = useState(0);
      const update = useCallback(() => {
        setTick(tick => tick + 1);
      }, [])
      return update;
    };

    const withoutExtension = (v) => v.split('.')[0];

    export const App = () => {

      const classes = useStyles();
      useForceUpdate();

      const [cordsList, setCordsList] = useState<Map<string, ICord[]>>(new Map());
      const [currentFile, setCurrentFile] = useState<IFile>(null);
      const [files, setFiles] = useState<IFile[]>([]);
      const [crop, setCrop] = useState(false);

      const getInitialCords = useCallback((url) => {
        if (cordsList && cordsList.has(url)) {
          return cordsList.get(url);
        } else {
          return [];
        }
      }, [cordsList]);

      const onSave = useCallback((url, cords) => {
        const file = files.find((f) => f.url === url);

        const applyRoiAdjust = (cords, roi) => cords.slice()
          .filter(({type}) => type !== 'roi').map((c) => ({
            ...c,
            top: max(c.top - roi.top, 0),
            left: max(c.left - roi.left, 0),
            height: min(max(c.top + c.height - roi.top, 0), max(roi.top + roi.height - c.top, 0), roi.height),
            width: min(max(c.left + c.width - roi.left, 0), max(roi.left + roi.width - c.left, 0), roi.width),
          }));

        if (crop) {
          const roi = cords.find((c) => c.type === 'roi');
          const {top, left, height, width} = roi;
          const {url, name} = file;
          saveImageFile({url, name, top, left, height, width});
          saveMarkupFile(applyRoiAdjust(cords, roi).map(({name, top, left, height, width}) =>
            createExportCord({
              name, top, left, height, width,
              naturalHeight: roi.height,
              naturalWidth: roi.width,
            })
          ).join("\n"), withoutExtension(name) + '.txt');
        } else {
          const { name, naturalHeight, naturalWidth } = file;
          saveMarkupFile(cords.filter(({type}) => type !== 'roi').map(({name, top, left, height, width}) =>
            createExportCord({
              name, top, left, height, width, naturalHeight, naturalWidth
            })
          ).join("\n"), withoutExtension(name) + '.txt');
        }
      }, [files]);

      const onAddImage = async () => {
        const file: IFile = await openImage();
        setFiles((files) => [...files, file]);
        setCurrentFile(file);
      };

      const onGo = useCallback((go) => {
        if (currentFile) {
          const {url} = currentFile;
          const [index] = files.map((v, i) => [i, v]).find(([, v]) => (v as IFile).url === url);
          const file = files[index + go];
          if (file) {
            setCurrentFile(file);
          }
        }
      }, [currentFile, files]);

      const onRemoveImage = (url) => setFiles((files) => {
        const result = files.filter((f) => f.url !== url);
        setCurrentFile(result.length === 0 ? null : result[0]);
        return result;
      });

      const onSelectImage = (url) =>
        setCurrentFile(files.find((f) => f.url === url));

      const onEditorChange = (url, cords) => setCordsList((cordsList) => {
        cordsList.set(url, cords);
        return cordsList;
      });

      const onDropped = (files, cords) => {
        setFiles(files);
        setCordsList(cords);
      };

      useEffect(() => {
        const handler = (e) => {
          e.preventDefault();
          const {key} = e;
          onGo(key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
      }, [onGo]);

      const render = () => {
        if (currentFile) {
          const {url, name, naturalWidth, naturalHeight} = currentFile;
          return (
            <Editor
              src={url}
              name={name}
              onCrop={(v) => setCrop(v)}
              naturalWidth={naturalWidth}
              naturalHeight={naturalHeight}
              initialCords={getInitialCords(url)}
              onSave={(cords) => onSave(url, cords)}
              onChange={(c) => onEditorChange(url, c)}/>
          );
        } else {
          return (
            <div className={classes.openFile}>
              <Typography variant="h4">
                Please open file to continue
              </Typography>
              <br/>
              <Typography variant="subtitle1">
                Or drag multiple files together with txt markup (optionally) directly into the browser window. Only .png and .jpg extensions are supported
              </Typography>
            </div>
          );
        }
      };

      return (
        <Fragment>
          <DragAndDrop onDropped={onDropped}/>
          <Drawer variant="permanent" open={true} className={classes.drawer}>
            <Files
              files={files}
              current={currentFile?.url}
              onGo={onGo}
              onAdd={onAddImage}
              onRemove={onRemoveImage}
              onSelect={onSelectImage}/>
          </Drawer>
          <div className={classes.adjust}>
            {render()}
          </div>
        </Fragment>
      );
    };

  } // namespace components

} // namespace mark
