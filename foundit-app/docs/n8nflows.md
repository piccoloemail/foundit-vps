# N8N Workflow v008 - Comando con Proxy

## Execute Command1 - Comando para VPS con N8N en Docker:

```
HTTP_PROXY=http://host.docker.internal:8118 HTTPS_PROXY=http://host.docker.internal:8118 yt-dlp -x --audio-format mp3 -o "/tmp/{{$json.video_id}}.mp3" "{{$json.youtube_url}}"
```

## Si el anterior no funciona, probar con:

```
HTTP_PROXY=http://172.17.0.1:8118 HTTPS_PROXY=http://172.17.0.1:8118 yt-dlp -x --audio-format mp3 -o "/tmp/{{$json.video_id}}.mp3" "{{$json.youtube_url}}"
```

## IMPORTANTE: N8N en Docker no puede usar localhost/127.0.0.1 para acceder al host