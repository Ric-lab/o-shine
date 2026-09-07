import { Capacitor } from '@capacitor/core';
import { AdMob, AdmobConsentStatus, RewardAdPluginEvents } from '@capacitor-community/admob';

const TEST_ID = 'ca-app-pub-3940256099942544/5224354917';
const testMode = import.meta.env?.VITE_ADMOB_TEST_MODE !== 'false';
const adId = testMode ? TEST_ID : import.meta.env?.VITE_ADMOB_REWARDED_ID?.trim();
export const adsAvailable = Capacitor.getPlatform() === 'android' && !!adId;
export const adPrivacyAvailable = adsAvailable && !testMode;

export function createRewardedAds({ sdk = AdMob, platform = () => Capacitor.getPlatform(),
    unitId = adId, testing = testMode, timeoutMs = 120000 } = {}) {
    let busy = false;
    let initialized = false;
    async function prepareConsent() {
        if (platform() !== 'android') throw new Error('Anúncios disponíveis no aplicativo Android.');
        if (!unitId) throw new Error('Anúncios ainda não configurados.');
        if (!initialized) {
            await sdk.initialize();
            initialized = true;
        }
        // Google's demo app has no publisher UMP configuration.
        // This path is restricted to the official demo unit.
        if (testing && unitId === TEST_ID) return { canRequestAds: true };
        let info = await sdk.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
            info = await sdk.showConsentForm();
        }
        return info;
    }
    return {
        async privacyOptions() {
            if (busy) throw new Error('Aguarde o anúncio terminar.');
            busy = true;
            try {
                const info = await prepareConsent();
                if (info.privacyOptionsRequirementStatus === 'REQUIRED') await sdk.showPrivacyOptionsForm();
                else return 'Não há opções adicionais de consentimento para esta sessão.';
            } finally { busy = false; }
        },
        async show() {
            if (busy) throw new Error('Já existe um anúncio em andamento.');
            busy = true;
            const listeners = [];
            let timer;
            let ended = false;
            try {
                const info = await prepareConsent();
                if (!info.canRequestAds) throw new Error('Anúncio indisponível com o consentimento atual.');
                let earned = false;
                let settle;
                const done = new Promise(resolve => { settle = resolve; });
                const finish = result => {
                    if (ended) return;
                    ended = true;
                    settle(result);
                };
                listeners.push(await sdk.addListener(RewardAdPluginEvents.Rewarded, () => {
                    if (!ended) earned = true;
                }));
                listeners.push(await sdk.addListener(RewardAdPluginEvents.Dismissed, () => finish({ earned })));
                listeners.push(await sdk.addListener(RewardAdPluginEvents.Showed, () => clearTimeout(timer)));
                for (const event of [RewardAdPluginEvents.FailedToLoad, RewardAdPluginEvents.FailedToShow]) {
                    listeners.push(await sdk.addListener(event, () => finish({ error: true })));
                }
                timer = setTimeout(() => finish({ error: true }), timeoutMs);
                // Do not await show(): on Android its promise may remain pending
                // when the user dismisses without earning a reward.
                const launch = async () => {
                    await sdk.prepareRewardVideoAd({ adId: unitId, isTesting: testing });
                    if (!ended) await sdk.showRewardVideoAd();
                };
                launch().catch(() => finish({ error: true }));
                const result = await done;
                if (result.error) throw new Error('Não foi possível exibir o anúncio. Tente novamente.');
                return result.earned;
            } finally {
                ended = true;
                clearTimeout(timer);
                await Promise.allSettled(listeners.map(listener => listener.remove()));
                busy = false;
            }
        },
    };
}

export const rewardedAds = createRewardedAds();
