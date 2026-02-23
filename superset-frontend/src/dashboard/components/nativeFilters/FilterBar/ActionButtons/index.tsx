/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { useCallback, useMemo, useState } from 'react';
import {
  css,
  DataMaskState,
  DataMaskStateWithId,
  t,
  isDefined,
  SupersetTheme,
  styled,
} from '@superset-ui/core';
import Button from 'src/components/Button';
import Loading from 'src/components/Loading';
import Modal from 'src/components/Modal';
import { Input } from 'src/components/Input';
import { Switch } from 'src/components/Switch';
import { OPEN_FILTER_BAR_WIDTH } from 'src/dashboard/constants';
import { rgba } from 'emotion-rgba';
import { FilterBarOrientation } from 'src/dashboard/types';
import { getFilterBarTestId } from '../utils';

interface ActionButtonsProps {
  width?: number;
  onClearAll: () => void;
  onRefreshAll: () => void;
  dataMaskSelected: DataMaskState;
  dataMaskApplied: DataMaskStateWithId;
  filterBarOrientation?: FilterBarOrientation;
}

const REFRESH_ICON_URL =
  'https://cdn.pixelbin.io/v2/fynd-console/original/fds/icons/ic_refresh.svg';

// Log environment variables
console.log('📊 Dashboard Environment Variables:', {
  ENABLE_DASHBOARD_SNAPSHOT: process.env.ENABLE_DASHBOARD_SNAPSHOT || 'not set',
  SNAPSHOT_EMAIL_WEBHOOK_URL: process.env.SNAPSHOT_EMAIL_WEBHOOK_URL || 'not set',
});

// const isDashboardSnapshotEnabled = () =>
//   process.env.ENABLE_DASHBOARD_SNAPSHOT?.toLowerCase() === 'true';
// const getSnapshotEmailWebhookUrl = () =>
//   process.env.SNAPSHOT_EMAIL_WEBHOOK_URL || '';

const isDashboardSnapshotEnabled = () => true;
const getSnapshotEmailWebhookUrl = () =>
  'https://asia-south1.workflow.boltic.app/a4fcf7c2-6d54-433b-9b4f-d4e62f3aa817/zenith/email/snapshot';

const containerStyle = (theme: SupersetTheme) => css`
  display: flex;
  align-items: center;

  && > .filter-refresh-button,
  && > .filter-snapshot-button,
  && > .filter-clear-all-button {
    color: ${theme.colors.grayscale.base};
    margin-left: 0;
    display: inline-flex;
    align-items: center;
    &:hover {
      color: ${theme.colors.primary.dark1};
    }

    &[disabled],
    &[disabled]:hover {
      color: ${theme.colors.grayscale.light1};
    }
  }
`;

const verticalStyle = (theme: SupersetTheme, width: number) => css`
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  position: fixed;
  z-index: 100;

  // filter bar width minus 1px for border
  width: ${width - 1}px;
  bottom: 0;

  padding: ${theme.gridUnit * 4}px;
  padding-top: ${theme.gridUnit * 6}px;

  background: linear-gradient(
    ${rgba(theme.colors.grayscale.light5, 0)},
    ${theme.colors.grayscale.light5} ${theme.opacity.mediumLight}
  );

  & > button {
    pointer-events: auto;
  }
`;

const horizontalStyle = (theme: SupersetTheme) => css`
  align-items: center;
  margin-left: auto;
  && > .filter-snapshot-button,
  && > .filter-clear-all-button {
    text-transform: capitalize;
    font-weight: ${theme.typography.weights.normal};
  }
`;

const SnapshotModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.gridUnit * 4}px;
`;

const SnapshotPreview = styled.div`
  max-height: 50vh;
  overflow: auto;
  border: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  padding: ${({ theme }) => theme.gridUnit * 2}px;
  background: ${({ theme }) => theme.colors.grayscale.light5};

  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const SnapshotPreviewLoading = styled.div`
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SnapshotPreviewMessage = styled.div`
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.grayscale.base};
  text-align: center;
  padding: ${({ theme }) => theme.gridUnit * 2}px;
`;

const SNAPSHOT_JPEG_QUALITY = 0.75;

const EmailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.gridUnit * 3}px;
`;

const EmailToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.gridUnit * 3}px;
`;

const PreviewTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.sizes.s}px;
  color: ${({ theme }) => theme.colors.grayscale.base};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  text-transform: capitalize;
`;

const ActionButtons = ({
  width = OPEN_FILTER_BAR_WIDTH,
  onClearAll,
  onRefreshAll,
  dataMaskApplied,
  dataMaskSelected,
  filterBarOrientation = FilterBarOrientation.Vertical,
}: ActionButtonsProps) => {
  const dashboardSnapshotEnabled = isDashboardSnapshotEnabled();
  const snapshotEmailWebhookUrl = getSnapshotEmailWebhookUrl();

  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotPreviewUrl, setSnapshotPreviewUrl] = useState('');
  const [snapshotCaptureFailed, setSnapshotCaptureFailed] = useState(false);
  const [sendToEmail, setSendToEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [snapshotFileName, setSnapshotFileName] = useState('');
  const isClearAllEnabled = useMemo(
    () =>
      Object.values(dataMaskApplied).some(
        filter =>
          isDefined(dataMaskSelected[filter.id]?.filterState?.value) ||
          (!dataMaskSelected[filter.id] &&
            isDefined(filter.filterState?.value)),
      ),
    [dataMaskApplied, dataMaskSelected],
  );
  const isVertical = filterBarOrientation === FilterBarOrientation.Vertical;

  const buildSnapshot = useCallback(async () => {
    if (!dashboardSnapshotEnabled) return;
    if (isSnapshotting) return;

    const contentWrapper = document.querySelector(
      '[data-test="dashboard-content-wrapper"]',
    ) as HTMLElement | null;
    if (!contentWrapper) {
      setSnapshotCaptureFailed(true);
      return;
    }

    setIsSnapshotting(true);
    setSnapshotCaptureFailed(false);
    try {
      // eslint-disable-next-line import/no-extraneous-dependencies
      const { default: html2canvas } = await import('html2canvas');
      const rawCanvas = await html2canvas(contentWrapper, {
        useCORS: true,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        windowWidth: contentWrapper.scrollWidth,
        windowHeight: contentWrapper.scrollHeight,
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `dashboard-snapshot-${timestamp}.jpg`;
      const dataUrl = rawCanvas.toDataURL('image/jpeg', SNAPSHOT_JPEG_QUALITY);
      setSnapshotPreviewUrl(dataUrl);
      setSnapshotFileName(fileName);
    } catch (error) {
      setSnapshotCaptureFailed(true);
      // eslint-disable-next-line no-console
      console.error('Snapshot capture failed', error);
    } finally {
      setIsSnapshotting(false);
    }
  }, [dashboardSnapshotEnabled, isSnapshotting]);

  const onOpenSnapshotModal = useCallback(async () => {
    if (!dashboardSnapshotEnabled) return;
    setShowSnapshotModal(false);
    setSnapshotPreviewUrl('');
    setSnapshotCaptureFailed(false);
    setSnapshotFileName('');
    await buildSnapshot();
    setShowSnapshotModal(true);
  }, [buildSnapshot, dashboardSnapshotEnabled]);

  const onDownloadSnapshot = useCallback(() => {
    if (!snapshotPreviewUrl || !snapshotFileName) return;
    const link = document.createElement('a');
    link.download = snapshotFileName;
    link.href = snapshotPreviewUrl;
    link.click();
  }, [snapshotFileName, snapshotPreviewUrl]);

  const onSnapshotPrimaryAction = useCallback(async () => {
    if (!dashboardSnapshotEnabled) return;
    if (!snapshotPreviewUrl || !snapshotFileName) return;

    if (sendToEmail) {
      const payload = {
        messageType: 'Snapshot',
        email,
        fileName: snapshotFileName,
        imageDataUrl: snapshotPreviewUrl,
        generatedAt: new Date().toISOString(),
      };
      if (!snapshotEmailWebhookUrl) {
        // eslint-disable-next-line no-console
        console.warn(
          'SNAPSHOT_EMAIL_WEBHOOK_URL is not configured. Skipping snapshot email request.',
        );
        return;
      }
      try {
        await fetch(snapshotEmailWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to send snapshot payload', error);
      }
      return;
    }
    onDownloadSnapshot();
  }, [
    dashboardSnapshotEnabled,
    email,
    onDownloadSnapshot,
    sendToEmail,
    snapshotEmailWebhookUrl,
    snapshotFileName,
    snapshotPreviewUrl,
  ]);

  const onCloseSnapshotModal = useCallback(() => {
    setShowSnapshotModal(false);
  }, []);

  return (
    <>
      <div
        css={(theme: SupersetTheme) => [
          containerStyle(theme),
          isVertical ? verticalStyle(theme, width) : horizontalStyle(theme),
        ]}
        data-test="filterbar-action-buttons"
      >
        {dashboardSnapshotEnabled && (
          <Button
            buttonStyle="link"
            buttonSize="small"
            className="filter-snapshot-button"
            disabled={isSnapshotting}
            onClick={onOpenSnapshotModal}
          >
            {t('Snapshot')}
          </Button>
        )}
        <Button
          buttonStyle="link"
          buttonSize="small"
          className="filter-clear-all-button"
          onClick={onRefreshAll}
          {...getFilterBarTestId('refresh-button')}
        >
          <img
            src={REFRESH_ICON_URL}
            alt={t('Refresh all charts')}
            css={css`
              height: 14px;
              width: 14px;
              margin-right: 4px;
            `}
          />
          {t('Refresh')}
        </Button>
        <Button
          disabled={!isClearAllEnabled}
          buttonStyle="link"
          buttonSize="small"
          className="filter-clear-all-button"
          onClick={onClearAll}
          {...getFilterBarTestId('clear-button')}
        >
          {t('Reset All')}
        </Button>
      </div>
      {dashboardSnapshotEnabled && (
        <Modal
          show={showSnapshotModal}
          onHide={onCloseSnapshotModal}
          title={t('Snapshot')}
          primaryButtonName={
            sendToEmail ? t('Send to Email') : t('Download Snapshot')
          }
          disablePrimaryButton={!snapshotPreviewUrl || isSnapshotting}
          onHandledPrimaryAction={onSnapshotPrimaryAction}
          primaryButtonLoading={isSnapshotting}
        >
          <SnapshotModalContent>
            <PreviewTitle>{t('Preview')}</PreviewTitle>
            <SnapshotPreview>
              {snapshotPreviewUrl ? (
                <img
                  src={snapshotPreviewUrl}
                  alt={t('Dashboard snapshot preview')}
                />
              ) : isSnapshotting ? (
                <SnapshotPreviewLoading>
                  <Loading position="inline-centered" />
                </SnapshotPreviewLoading>
              ) : snapshotCaptureFailed ? (
                <SnapshotPreviewMessage>
                  {t('Unable to generate snapshot. Please try again.')}
                </SnapshotPreviewMessage>
              ) : (
                <SnapshotPreviewMessage>
                  {t('Snapshot preview is not available.')}
                </SnapshotPreviewMessage>
              )}
            </SnapshotPreview>
            <EmailSection>
              <EmailToggleRow>
                <Switch checked={sendToEmail} onChange={setSendToEmail} />
                <span>{t('Do you want this report in an email?')}</span>
              </EmailToggleRow>
              {sendToEmail && (
                <Input
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder={t('Enter recipient email')}
                />
              )}
            </EmailSection>
          </SnapshotModalContent>
        </Modal>
      )}
    </>
  );
};

export default ActionButtons;
