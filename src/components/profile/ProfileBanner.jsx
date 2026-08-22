import { getBannerPreset } from '../../data/constants.js';

export default function ProfileBanner({ profile, className = 'h-16' }) {
  const style =
    profile?.bannerType === 'IMAGE' && profile.bannerImageUrl
      ? { backgroundImage: `url(${profile.bannerImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundImage: getBannerPreset(profile?.bannerColor).css };

  return <div className={`w-full ${className}`} style={style} />;
}
