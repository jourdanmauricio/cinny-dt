import React, { ReactNode, useEffect, useState } from 'react';
import { Box, Chip, Icon, IconButton, Icons, Text, color, config, toRem } from 'folds';
import { UploadCard, UploadCardError, UploadCardProgress } from './UploadCard';
import { UploadStatus, UploadSuccess, useBindUploadAtom } from '../../state/upload';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { TUploadContent } from '../../utils/matrix';
import { bytesToSize, getFileTypeIcon } from '../../utils/common';
import {
  roomUploadAtomFamily,
  TUploadItem,
  TUploadMetadata,
} from '../../state/room/roomInputDrafts';
import { useObjectURL } from '../../hooks/useObjectURL';
import { useMediaConfig } from '../../hooks/useMediaConfig';
import { DtImageEditor } from '../../features/dt-image-editor/DtImageEditor';

type PreviewImageProps = {
  fileItem: TUploadItem;
};
function PreviewImage({ fileItem }: PreviewImageProps) {
  const { originalFile, metadata } = fileItem;
  const fileUrl = useObjectURL(originalFile);

  return (
    <img
      style={{
        objectFit: 'contain',
        width: '100%',
        height: toRem(152),
        filter: metadata.markedAsSpoiler ? 'blur(44px)' : undefined,
      }}
      alt={originalFile.name}
      src={fileUrl}
    />
  );
}

type PreviewVideoProps = {
  fileItem: TUploadItem;
};
function PreviewVideo({ fileItem }: PreviewVideoProps) {
  const { originalFile, metadata } = fileItem;
  const fileUrl = useObjectURL(originalFile);

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      style={{
        objectFit: 'contain',
        width: '100%',
        height: toRem(152),
        filter: metadata.markedAsSpoiler ? 'blur(44px)' : undefined,
      }}
      src={fileUrl}
    />
  );
}

type MediaPreviewProps = {
  fileItem: TUploadItem;
  onSpoiler: (marked: boolean) => void;
  /** DT: editar la imagen antes de enviarla (solo admins) */
  onEdit?: () => void;
  children: ReactNode;
};
function MediaPreview({ fileItem, onSpoiler, onEdit, children }: MediaPreviewProps) {
  const { originalFile, metadata } = fileItem;
  const fileUrl = useObjectURL(originalFile);

  return fileUrl ? (
    <Box
      style={{
        borderRadius: config.radii.R300,
        overflow: 'hidden',
        backgroundColor: 'black',
        position: 'relative',
      }}
    >
      {children}
      <Box
        justifyContent="End"
        gap="100"
        style={{
          position: 'absolute',
          bottom: config.space.S100,
          left: config.space.S100,
          right: config.space.S100,
        }}
      >
        {onEdit && (
          <Chip
            variant="Secondary"
            fill="Soft"
            radii="Pill"
            before={<Icon src={Icons.Pencil} size="50" />}
            onClick={onEdit}
          >
            <Text size="B300">Editar</Text>
          </Chip>
        )}
        <Chip
          variant={metadata.markedAsSpoiler ? 'Warning' : 'Secondary'}
          fill="Soft"
          radii="Pill"
          aria-pressed={metadata.markedAsSpoiler}
          before={<Icon src={Icons.EyeBlind} size="50" />}
          onClick={() => onSpoiler(!metadata.markedAsSpoiler)}
        >
          <Text size="B300">Spoiler</Text>
        </Chip>
      </Box>
    </Box>
  ) : null;
}

type UploadCardRendererProps = {
  isEncrypted?: boolean;
  fileItem: TUploadItem;
  setMetadata: (fileItem: TUploadItem, metadata: TUploadMetadata) => void;
  onRemove: (file: TUploadContent) => void;
  onComplete?: (upload: UploadSuccess) => void;
  /** DT: reemplazar el archivo por la versión editada (solo admins, no para GIFs) */
  onEdit?: (fileItem: TUploadItem, edited: File) => void;
};
export function UploadCardRenderer({
  isEncrypted,
  fileItem,
  setMetadata,
  onRemove,
  onComplete,
  onEdit,
}: UploadCardRendererProps) {
  const [editing, setEditing] = useState(false);
  const editSrc = useObjectURL(editing ? fileItem.originalFile : undefined);
  const canEdit =
    !!onEdit &&
    fileItem.originalFile.type.startsWith('image') &&
    fileItem.originalFile.type !== 'image/gif';
  const mx = useMatrixClient();
  const mediaConfig = useMediaConfig();
  const allowSize = mediaConfig['m.upload.size'] || Infinity;

  const uploadAtom = roomUploadAtomFamily(fileItem.file);
  const { metadata } = fileItem;
  const { upload, startUpload, cancelUpload } = useBindUploadAtom(mx, uploadAtom, isEncrypted);
  const { file } = upload;
  const fileSizeExceeded = file.size >= allowSize;

  if (upload.status === UploadStatus.Idle && !fileSizeExceeded) {
    startUpload();
  }

  const handleSpoiler = (marked: boolean) => {
    setMetadata(fileItem, { ...metadata, markedAsSpoiler: marked });
  };

  const removeUpload = () => {
    cancelUpload();
    onRemove(file);
  };

  useEffect(() => {
    if (upload.status === UploadStatus.Success) {
      onComplete?.(upload);
    }
  }, [upload, onComplete]);

  return (
    <>
      <UploadCard
        radii="300"
        before={<Icon src={getFileTypeIcon(Icons, file.type)} />}
        after={
          <>
            {upload.status === UploadStatus.Error && (
              <Chip
                as="button"
                onClick={startUpload}
                aria-label="Retry Upload"
                variant="Critical"
                radii="Pill"
                outlined
              >
                <Text size="B300">Retry</Text>
              </Chip>
            )}
            <IconButton
              onClick={removeUpload}
              aria-label="Cancel Upload"
              variant="SurfaceVariant"
              radii="Pill"
              size="300"
            >
              <Icon src={Icons.Cross} size="200" />
            </IconButton>
          </>
        }
        bottom={
          <>
            {fileItem.originalFile.type.startsWith('image') && (
              <MediaPreview
                fileItem={fileItem}
                onSpoiler={handleSpoiler}
                onEdit={canEdit ? () => setEditing(true) : undefined}
              >
                <PreviewImage fileItem={fileItem} />
              </MediaPreview>
            )}
            {fileItem.originalFile.type.startsWith('video') && (
              <MediaPreview fileItem={fileItem} onSpoiler={handleSpoiler}>
                <PreviewVideo fileItem={fileItem} />
              </MediaPreview>
            )}
            {upload.status === UploadStatus.Idle && !fileSizeExceeded && (
              <UploadCardProgress sentBytes={0} totalBytes={file.size} />
            )}
            {upload.status === UploadStatus.Loading && (
              <UploadCardProgress sentBytes={upload.progress.loaded} totalBytes={file.size} />
            )}
            {upload.status === UploadStatus.Error && (
              <UploadCardError>
                <Text size="T200">{upload.error.message}</Text>
              </UploadCardError>
            )}
            {upload.status === UploadStatus.Idle && fileSizeExceeded && (
              <UploadCardError>
                <Text size="T200">
                  The file size exceeds the limit. Maximum allowed size is{' '}
                  <b>{bytesToSize(allowSize)}</b>, but the uploaded file is{' '}
                  <b>{bytesToSize(file.size)}</b>.
                </Text>
              </UploadCardError>
            )}
          </>
        }
      >
        <Text size="H6" truncate>
          {file.name}
        </Text>
        {upload.status === UploadStatus.Success && (
          <Icon style={{ color: color.Success.Main }} src={Icons.Check} size="100" />
        )}
      </UploadCard>
      {editing && editSrc && onEdit && (
        <DtImageEditor
          src={editSrc}
          name={fileItem.originalFile.name}
          onClose={() => setEditing(false)}
          onDone={(edited) => {
            setEditing(false);
            // La subida del original ya arrancó: se cancela y se sube el editado
            cancelUpload();
            onEdit(fileItem, edited);
          }}
        />
      )}
    </>
  );
}
