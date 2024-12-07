import {
  System,
  Component,
  TagComponent,
  Types,
} from "three/addons/libs/ecsy.module.js";

class Video extends TagComponent {}

class VideoSystem extends System {
  init(attributes) {
    this.videos = attributes.videos;
    this.page = attributes.page;
    this.videosPerPage = attributes.videosPerPage;
  }
  execute() {
    this.queries.videos.results.forEach((entity) => {});
  }
  updateVideos(videos) {
    this.videos = videos;
    this.page = 1;
    this.queries.videos.results.forEach((entity) => {});
  }
  setVideo(title, url, seek, fov) {
    this.queries.videos.results.forEach((entity) => {
      const videoData = entity.getMutableComponent(VideoData);
      videoData.title = title;
      videoData.fov = fov;
      videoData.videoElement.src = url;
      videoData.videoElement.load();
      videoData.videoElement.currentPosition = seek;
      videoData.videoElement.play();
    });
  }
}

VideoSystem.queries = {
  videos: {
    components: [Video],
    listen: {
      changed: true,
    },
  },
};

export { VideoSystem, Video };
