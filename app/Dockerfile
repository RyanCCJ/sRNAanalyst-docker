FROM python:3.6-slim

ARG locfit="https://cran.r-project.org/src/contrib/Archive/locfit/locfit_1.5-9.4.tar.gz"
ARG fastqc="https://www.bioinformatics.babraham.ac.uk/projects/fastqc/fastqc_v0.12.1.zip"
ARG bowtie2="https://sourceforge.net/projects/bowtie-bio/files/bowtie2/2.5.3/bowtie2-2.5.3-linux-x86_64.zip/download"
ARG yq="https://github.com/mikefarah/yq/releases/download/v4.43.1/yq_linux_amd64"

WORKDIR /app

COPY requirements.txt ./
RUN set -xe \
    && apt-get update \
    && apt-get install -y wget r-base default-jre \
    # edgeR
    && R -e "install.packages('BiocManager')" \
    && R -e "install.packages('${locfit}', repos=NULL, type='source')" \
    && R -e "BiocManager::install('edgeR')" \
    # Python packages
    && pip install -r requirements.txt

COPY . .
RUN set -xe \
    # FastQC
    && wget ${fastqc} -O FastQC.zip \
    && unzip FastQC.zip \
    && mv FastQC src/toolkit/ \
    && rm FastQC.zip \
    # Bowtie2
    && wget ${bowtie2} -O Bowtie2.zip \
    && unzip -j Bowtie2.zip -d Bowtie2 \
    && mv Bowtie2 src/toolkit/ \
    && rm Bowtie2.zip \
    # yq
    && wget ${yq} -O yq \
    && mv yq src/toolkit/ \
    && chmod +x src/toolkit/yq

CMD [ "python", "manage.py", "runserver", "0.0.0.0:8000" ]
